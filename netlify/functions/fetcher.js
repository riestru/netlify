export async function handler(event, context) {
  const url = event.queryStringParameters.url;
  if (!url) {
    return {
      statusCode: 400,
      body: "Error: parameter 'url' is missing"
    };
  }

  try {
    const response = await fetch(url);
    const text = await response.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "Error fetching URL: " + err.message
    };
  }
}
