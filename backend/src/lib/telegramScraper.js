/**
 * Telegram Channel & Group Web Scraper
 * Scrapes the public web preview at https://t.me/s/{username}
 */
export async function scrapeTelegramChannel(username) {
  try {
    const cleanUsername = username.replace("@", "").trim();
    if (!cleanUsername) return [];

    const url = `https://t.me/s/${cleanUsername}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      console.warn(`Telegram web preview fetch failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const html = await response.text();

    const messages = [];
    // Telegram preview lists messages inside elements with class "tgme_widget_message_wrap"
    const messageBlockRegex = /<div class="tgme_widget_message_wrap[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;

    let match;
    let index = 0;
    while ((match = messageBlockRegex.exec(html)) !== null && index < 25) {
      const block = match[1];

      // Extract text content
      const textMatch = block.match(/<div class="tgme_widget_message_text[^"]*"[^>]* dir="auto">([\s\S]*?)<\/div>/) || 
                         block.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      let text = textMatch ? textMatch[1] : "";
      // Clean HTML tags and entities
      text = text.replace(/<[^>]*>/g, "")
                 .replace(/&amp;/g, "&")
                 .replace(/&lt;/g, "<")
                 .replace(/&gt;/g, ">")
                 .replace(/&quot;/g, '"')
                 .replace(/&#39;/g, "'")
                 .trim();

      // Extract photo background url
      const photoMatch = block.match(/background-image:url\('([^']+)'\)/) || 
                         block.match(/background-image:\s*url\("([^"]+)"\)/);
      const photoUrl = photoMatch ? photoMatch[1] : null;

      // Extract video src url
      const videoMatch = block.match(/<video[^>]*src="([^"]*)"/);
      const videoUrl = videoMatch ? videoMatch[1] : null;

      // Extract date and time
      const dateMatch = block.match(/<time datetime="([^"]*)"/);
      const date = dateMatch ? new Date(dateMatch[1]) : new Date();

      if (text || photoUrl || videoUrl) {
        messages.push({
          _id: `tg-${cleanUsername}-${date.getTime()}-${messages.length}`,
          text: text || (photoUrl ? "[Photo]" : videoUrl ? "[Video]" : ""),
          image: photoUrl || undefined,
          video: videoUrl || undefined,
          createdAt: date,
          senderId: {
            _id: `tg-author-${cleanUsername}`,
            fullName: `@${cleanUsername}`,
            profilePic: "https://telegram.org/img/t_logo.png"
          },
          isTelegramPost: true
        });
      }
      index++;
    }

    // Sort from oldest to newest to match standard chat view chronological order
    return messages;
  } catch (error) {
    console.error(`Error in scrapeTelegramChannel for ${username}:`, error.message);
    return [];
  }
}