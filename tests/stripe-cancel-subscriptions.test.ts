import { beforeEach, describe, expect, it, vi } from "vitest";

const searchMock = vi.fn();
const cancelMock = vi.fn();

vi.mock("@/lib/stripe/server", () => ({
  getStripeServer: () => ({
    subscriptions: {
      search: searchMock,
      cancel: cancelMock,
    },
  }),
}));

describe("cancelStripeSubscriptionsForUser", () => {
  beforeEach(() => {
    vi.resetModules();
    searchMock.mockReset();
    cancelMock.mockReset();
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("no-ops when STRIPE_SECRET_KEY is unset", async () => {
    const { cancelStripeSubscriptionsForUser } = await import(
      "@/lib/stripe/cancel-subscriptions-for-user"
    );
    const result = await cancelStripeSubscriptionsForUser("00000000-0000-4000-8000-000000000001");
    expect(result).toEqual({ ok: true });
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("cancels non-terminal subscriptions and paginates search", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    searchMock
      .mockResolvedValueOnce({
        data: [{ id: "sub_a", status: "active" }],
        next_page: "cursor1",
      })
      .mockResolvedValueOnce({
        data: [
          { id: "sub_b", status: "canceled" },
          { id: "sub_c", status: "trialing" },
        ],
        next_page: null,
      });
    cancelMock.mockResolvedValue({});

    const { cancelStripeSubscriptionsForUser } = await import(
      "@/lib/stripe/cancel-subscriptions-for-user"
    );
    const result = await cancelStripeSubscriptionsForUser("00000000-0000-4000-8000-000000000002");

    expect(result).toEqual({ ok: true });
    expect(searchMock).toHaveBeenCalledTimes(2);
    expect(searchMock.mock.calls[1][0]).toMatchObject({ page: "cursor1" });
    expect(cancelMock).toHaveBeenCalledTimes(2);
    expect(cancelMock.mock.calls.map((c) => c[0])).toEqual(["sub_a", "sub_c"]);
  });
});
