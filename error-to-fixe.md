
## Error Type
Runtime TypeError

## Error Message
Cannot read properties of undefined (reading 'enabled')


    at AppShell (components\layout\app-shell.tsx:286:32)
    at RootLayout (app\layout.tsx:61:21)

## Code Frame
  284 |
  285 |       <MainLayout
> 286 |         breadcrumbs={resolved?.topMiddle.enabled}
      |                                ^
  287 |         footer={resolved?.footer.enabled}
  288 |         topMiddle={resolved?.topMiddle.enabled}
  289 |         leftBar={resolved?.leftBar.enabled}

Next.js version: 16.1.6 (Webpack)
