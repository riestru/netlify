export async function handler(event, context) {
  const url = event.queryStringParameters.url;
  if (!url) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "parameter 'url' is missing" })
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // Извлекаем нужные заголовки
    const subscriptionInfo = response.headers.get('subscription-userinfo');
    const profileTitle = response.headers.get('profile-title');
    const profileUrl = response.headers.get('profile-web-page-url');
    const supportUrl = response.headers.get('support-url');
    const updateInterval = response.headers.get('profile-update-interval');

    // Парсим subscription-userinfo
    const parseSubscriptionInfo = (info) => {
      if (!info) return {};
      const parts = info.split(';').map(s => s.trim());
      const result = {};
      parts.forEach(part => {
        const [key, value] = part.split('=').map(s => s.trim());
        result[key] = value;
      });
      return result;
    };

    const subInfo = parseSubscriptionInfo(subscriptionInfo);

    // Декодируем profile-title из base64
    let title = 'Unknown';
    if (profileTitle && profileTitle.startsWith('base64:')) {
      try {
        title = Buffer.from(profileTitle.substring(7), 'base64').toString('utf-8');
      } catch (e) {
        title = profileTitle;
      }
    }

    // Форматируем данные
    const userData = {
      username: url.split('/').pop() || 'Unknown',
      status: parseInt(subInfo.expire || '0') === 0 ? 'active' : 'limited',
      dataLimit: parseInt(subInfo.total || '0') === 0 ? '∞' : `${(parseInt(subInfo.total) / (1024**3)).toFixed(2)} GB`,
      dataUsed: `${(parseInt(subInfo.download || '0') / (1024**3)).toFixed(2)} GB`,
      expirationDate: parseInt(subInfo.expire || '0') === 0 ? '∞' : new Date(parseInt(subInfo.expire) * 1000).toISOString(),
      profileTitle: title,
      profileUrl: profileUrl,
      supportUrl: supportUrl,
      updateInterval: updateInterval
    };

    // Возвращаем как JSON
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(userData, null, 2)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ 
        error: "Error fetching URL", 
        message: err.message 
      })
    };
  }
}
