import { toast } from "./toast";

export async function shareText(title: string, text: string): Promise<void> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url: window.location.href });
      return;
    }
  } catch {
    // user cancelled or share failed — fall through to clipboard
  }

  try {
    await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    toast("Copied to clipboard");
  } catch {
    toast("Couldn't share right now");
  }
}
