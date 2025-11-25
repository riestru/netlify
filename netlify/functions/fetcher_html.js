export async function handler(event, context) {
  const url = event.queryStringParameters.url;
  if (!url) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: "<h1>Error: parameter 'url' is missing</h1>"
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

    // Извлекаем username из URL (часть после последнего слеша, до запятой)
    const urlParts = url.split('/').pop() || '';
    const usernameMatch = urlParts.match(/^([^,]+)/);
    const username = usernameMatch ? Buffer.from(usernameMatch[1], 'base64').toString('utf-8') : 'Unknown';

    // Форматируем данные
    const totalBytes = parseInt(subInfo.total || '0');
    const downloadBytes = parseInt(subInfo.download || '0');
    const expireTimestamp = parseInt(subInfo.expire || '0');

    const dataLimit = totalBytes === 0 ? '∞' : formatBytes(totalBytes);
    const dataUsed = downloadBytes === 0 ? '0 B' : formatBytes(downloadBytes);
    const expirationDate = expireTimestamp === 0 ? '∞' : new Date(expireTimestamp * 1000).toLocaleString();
    const status = expireTimestamp === 0 || expireTimestamp > Date.now() / 1000 ? 'active' : 'expired';

    // Функция форматирования байтов
    function formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // HTML шаблон
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Information</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            margin: 0 0 20px 0;
            font-size: 24px;
            color: #2c3e50;
        }
        .info-line {
            display: flex;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
        }
        .info-line:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: 600;
            min-width: 150px;
            color: #555;
        }
        .value {
            color: #2c3e50;
        }
        .status-active {
            color: #27ae60;
            font-weight: 600;
        }
        .status-expired {
            color: #e74c3c;
            font-weight: 600;
        }
        .links {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #eee;
        }
        .link-item {
            margin: 10px 0;
        }
        a {
            color: #3498db;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>User Information</h1>
        
        <div class="info-line">
            <span class="label">Username:</span>
            <span class="value">${username}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Status:</span>
            <span class="value status-${status}">${status}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Data Limit:</span>
            <span class="value">${dataLimit}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Data Used:</span>
            <span class="value">${dataUsed}</span>
        </div>
        
        <div class="info-line">
            <span class="label">Expiration Date:</span>
            <span class="value">${expirationDate}</span>
        </div>
        
        <div class="links">
            <h2 style="margin: 0 0 15px 0; font-size: 18px;">Links:</h2>
            ${profileUrl ? `<div class="link-item"><a href="${profileUrl}" target="_blank">Profile Page</a></div>` : ''}
            ${supportUrl ? `<div class="link-item"><a href="${supportUrl}" target="_blank">Support</a></div>` : ''}
        </div>
    </div>
</body>
</html>
    `;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: html
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: `<h1>Error fetching URL</h1><p>${err.message}</p>`
    };
  }
}
