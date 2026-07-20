export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("Browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") return true;

  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const showNotification = (
  title: string,
  body: string,
  onClick?: () => void,
) => {
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  const notification = new Notification(title, {
    body,
    icon: "/chat-icon.png",
    badge: "/chat-icon.png",
    tag: "alap-notification",
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
    // Focus existing tab instead of reload
    if (window.location.pathname !== "/chat") {
      window.location.href = "/chat";
    }
    onClick?.();
  };
};

export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
    console.log("✅ Service worker registered");
  } catch (error) {
    console.error("Service worker registration failed:", error);
  }
};
