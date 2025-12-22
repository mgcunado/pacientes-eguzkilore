import { define } from "@/utils.ts";

export default define.page(function App({ Component }) {
  return (
    // <html> 
    <html class="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>pacientes-eguzkilore</title>
      </head>
      <body class="bg-gray-900 dark:bg-gray-600">
        <Component />
      </body>
    </html>
  );
});
