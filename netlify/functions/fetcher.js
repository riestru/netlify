export async function handler(event, context) {
  const url = event.queryStringParameters.url;
  if (!url) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: "Error: parameter 'url' is missing"
    };
  }

  try {
    const response = await fetch(url);
    const text = await response.text();

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "text/html; charset=utf-8",  // Изменено на text/html
        "Access-Control-Allow-Origin": "*"
      },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      },
      body: "Error fetching URL: " + err.message
    };
  }
}
