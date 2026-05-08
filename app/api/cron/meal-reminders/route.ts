import webpush from "web-push";
import { MEAL_REMINDER_TYPES, type MealReminderType } from "@/lib/meal-reminders";
import { getVapidServerConfig } from "@/lib/push-subscriptions";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ReminderSetting = {
  user_id: string;
  meal_type: MealReminderType;
  notify_time: string;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function unauthorizedResponse() {
  return Response.json(
    { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
    { status: 401 },
  );
}

function getJstParts(date: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    targetDate: `${value("year")}-${value("month")}-${value("day")}`,
    notifyTime: `${value("hour")}:${value("minute")}:00`,
  };
}

function getDueWindow(date = new Date(), minutes = 10) {
  const due = [];
  for (let i = minutes - 1; i >= 0; i -= 1) {
    due.push(getJstParts(new Date(date.getTime() - i * 60 * 1000)));
  }
  return due;
}

function getMealTypeLabel(mealType: MealReminderType) {
  return MEAL_REMINDER_TYPES.find((type) => type.value === mealType)?.label ?? "食事";
}

function verifyCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return unauthorizedResponse();
  }

  const vapid = getVapidServerConfig();
  if (!vapid) {
    return Response.json(
      { error: { message: "VAPID keys are not configured.", code: "VAPID_NOT_CONFIGURED" } },
      { status: 500 },
    );
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const supabase = getSupabaseAdminClient();
  const dueWindow = getDueWindow();
  const targetDateByNotifyTime = new Map(
    dueWindow.map((item) => [item.notifyTime, item.targetDate]),
  );
  const notifyTimes = [...new Set(dueWindow.map((item) => item.notifyTime))];
  const { data: settings, error: settingsError } = await supabase
    .from("meal_reminder_settings")
    .select("user_id,meal_type,notify_time")
    .eq("enabled", true)
    .in("notify_time", notifyTimes);

  if (settingsError) {
    console.error("[meal-reminder-cron] settings fetch failed", settingsError);
    return Response.json(
      { error: { message: "Failed to fetch reminder settings.", code: "SETTINGS_FETCH_FAILED" } },
      { status: 500 },
    );
  }

  const dueSettings = (settings ?? []) as ReminderSetting[];
  if (dueSettings.length === 0) {
    return Response.json({ ok: true, notifyTimes, due: 0, sent: 0 });
  }

  const userIds = [...new Set(dueSettings.map((setting) => setting.user_id))];
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id,user_id,endpoint,p256dh,auth")
    .in("user_id", userIds);

  if (subscriptionsError) {
    console.error("[meal-reminder-cron] subscriptions fetch failed", subscriptionsError);
    return Response.json(
      {
        error: {
          message: "Failed to fetch push subscriptions.",
          code: "SUBSCRIPTIONS_FETCH_FAILED",
        },
      },
      { status: 500 },
    );
  }

  const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>();
  for (const subscription of (subscriptions ?? []) as PushSubscriptionRow[]) {
    const list = subscriptionsByUser.get(subscription.user_id) ?? [];
    list.push(subscription);
    subscriptionsByUser.set(subscription.user_id, list);
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const setting of dueSettings) {
    const targetDate = targetDateByNotifyTime.get(setting.notify_time);
    if (!targetDate) {
      skipped += 1;
      continue;
    }

    const userSubscriptions = subscriptionsByUser.get(setting.user_id) ?? [];
    if (userSubscriptions.length === 0) {
      skipped += 1;
      continue;
    }

    const nowIso = new Date().toISOString();
    const { error: logError } = await supabase.from("meal_reminder_logs").insert({
      user_id: setting.user_id,
      meal_type: setting.meal_type,
      target_date: targetDate,
      first_sent_at: nowIso,
    });

    if (logError) {
      if (logError.code === "23505") {
        skipped += 1;
        continue;
      }
      console.error("[meal-reminder-cron] log insert failed", logError);
      failed += 1;
      continue;
    }

    const label = getMealTypeLabel(setting.meal_type);
    const payload = JSON.stringify({
      title: `${label}の時間です`,
      body: "写真を撮って、3秒で食事を記録しましょう。",
      url: "/meals/new",
      tag: `meal-reminder:${setting.meal_type}:${targetDate}`,
    });

    for (const subscription of userSubscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        sent += 1;
        await supabase
          .from("push_subscriptions")
          .update({ last_used_at: nowIso })
          .eq("id", subscription.id);
      } catch (caught) {
        failed += 1;
        const statusCode =
          typeof caught === "object" && caught !== null && "statusCode" in caught
            ? Number((caught as { statusCode?: unknown }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
        } else {
          console.error("[meal-reminder-cron] push failed", caught);
        }
      }
    }
  }

  return Response.json({
    ok: true,
    notifyTimes,
    due: dueSettings.length,
    sent,
    skipped,
    failed,
  });
}
