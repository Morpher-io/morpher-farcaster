# Project Conventions

This document outlines the coding conventions and best practices for our project, which uses Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## General Principles

- **Consistency**: Strive for consistent code style and patterns across the codebase.
- **Readability**: Write code that is easy to understand and maintain.
- **Simplicity**: Prefer simple solutions over complex ones.

---

## Next.js

We use the Next.js App Router.

- **File-based Routing**: Directory and file names in `src/app` define the routes. Use route groups `()` for organization without affecting the URL path.
- **Server Components by Default**: Components are Server Components by default. Only use Client Components when necessary (e.g., for hooks like `useState`, `useEffect`, or event listeners). Mark  
  them with `"use client";` at the top of the file.
- **Data Fetching**:
  - Use `async/await` in Server Components for data fetching. This leverages React's Suspense for streaming UI.
  - For Client Components, use libraries like SWR or React Query, or fetch within a `useEffect` hook.
- **Component Organization**:
  - Place page components directly in `src/app/[route]/page.tsx`.
  - Reusable components should be in `src/components/`.
  - UI components from shadcn/ui are in `src/components/ui/`.
- **Metadata**: Use the `generateMetadata` function in `layout.tsx` or `page.tsx` files to manage page metadata for SEO.

---

## TypeScript

We use TypeScript to ensure type safety.

- **Strict Mode**: `tsconfig.json` should have `strict: true` enabled.
- **Explicit Types**:
  - Define explicit types for function parameters and return values.
  - Use interfaces or types for object shapes. Prefer `type` for component props and `interface` for objects that might be extended.
- **Naming Conventions**:
  - Use `PascalCase` for types, interfaces, and component names (e.g., `type UserProfile`, `interface IProduct`, `function MyComponent`).
  - Use `camelCase` for variables and functions (e.g., `const userName`, `function getUser()`).
- **Non-null Assertion**: Avoid using the non-null assertion operator (`!`) unless you are absolutely certain the value is not `null` or `undefined`. Prefer type guards or optional chaining (`?.`).

---

## Tailwind CSS

1.  **Utility-First**: Embrace the utility-first approach. Apply styles directly in your HTML/JSX using Tailwind's utility classes.
2.  **Readability**:
    *   For very long lists of utility classes, consider grouping related utilities or using a pre-processor/formatter that can sort classes.
    *   Break down complex components into smaller ones to avoid overly long class strings on a single element.
3.  **Configuration (`tailwind.config.js`)**:
    *   Customise the default theme (colors, spacing, fonts, etc.) in `tailwind.config.js` to match your project's design system.
    *   Use `theme.extend` to add new values without overriding the defaults.
4.  **Responsive Design**: Use Tailwind's responsive prefixes (e.g., `sm:`, `md:`, `lg:`) to build responsive layouts. Design mobile-first where appropriate.
5.  **State Variants**: Utilise state variants like `hover:`, `focus:`, `active:`, `disabled:` to style elements based on their state.
6.  **Dark Mode**: Implement dark mode using the `dark:` variant if required by the project.
7.  **Don't Over-Abstract (Initially)**: Avoid premature abstraction into custom CSS classes or `@apply`. Stick to utilities as much as possible. If you find yourself repeating the same combination of utilities frequently, then consider creating a component or a custom class.
8.  **Purging**: Ensure `purge` (or `content` in Tailwind CSS v3+) is configured correctly in `tailwind.config.js` to remove unused styles in production builds, keeping the final CSS bundle small.
9.  **Class Ordering**: Consider using a class sorter (like Prettier plugin for Tailwind CSS) to maintain a consistent order of utility classes, improving readability and reducing merge conflicts.
10. **Avoid Magic Numbers**: Use theme values (e.g., `p-4` instead of `padding: 1rem`) rather than arbitrary values where possible. If custom values are needed, add them to the theme configuration.

## Shadcn/ui

1.  **Installation and Usage**: Follow the official Shadcn/ui documentation for installing components. Components are typically added via the CLI and become part of your codebase.
2.  **Customisation**:
    *   Since Shadcn/ui components are added directly to your project, you can (and should) customise them to fit your project's specific needs.
    *   Modify the component's code, styles (often using Tailwind CSS utility classes), and behaviour as required.
3.  **Theming**: Utilise CSS variables for theming as recommended by Shadcn/ui. Customise these variables to align with your project's design system.
4.  **Composition**: Compose more complex UI elements by combining multiple Shadcn/ui components or by integrating them with your own custom components.
5.  **Accessibility**: Shadcn/ui components are built with accessibility in mind (often using Radix UI primitives). Maintain these accessibility standards when customising components.
6.  **Stay Updated (Carefully)**: Periodically check for updates to Shadcn/ui components. Since components are copied into your project, updates are not automatic. You may need to re-add or manually update components, taking care to re-apply your customisations.
7.  **Directory Structure**: Keep Shadcn/ui components organised, typically within a `components/ui` directory as per the default setup.
8.  **Dependencies**: Be mindful of the peer dependencies required by Shadcn/ui components (e.g., Radix UI primitives, Tailwind CSS).


## Farcaster Mini Apps

1.  **SDK Usage**:
    *   Utilise the official `@farcaster/frame-sdk` for interacting with the Farcaster client environment.
    *   Keep the SDK updated to the latest version to leverage new features and security patches. Refer to the changelog.
2.  **Manifest File (`farcaster.json`)**:
    *   Host a valid `farcaster.json` file at `/.well-known/farcaster.json` on your app's domain.
    *   Ensure the `accountAssociation` is correctly set up and signed to verify domain ownership.
    *   Provide comprehensive metadata in the `frame` object (name, icon, URLs, splash screen details, etc.) for optimal display and discovery in Farcaster clients.
    *   Define `webhookUrl` if your app supports notifications.
    *   Specify `requiredChains` and `requiredCapabilities` if your app depends on specific blockchain networks or SDK features.
3.  **Mini App Embeds (`fc:frame`)**:
    *   For pages you want to be shareable in Farcaster feeds, include the `<meta name="fc:frame" content="<stringified Embed JSON>" />` tag.
    *   Ensure `imageUrl` has a 3:2 aspect ratio and is optimised for size.
    *   Use clear `button.title` calls-to-action.
    *   The `button.action.type` should typically be `launch_frame`.
    *   Provide `splashImageUrl` and `splashBackgroundColor` for a branded loading experience.
4.  **Loading and Initialisation**:
    *   Call `await sdk.actions.ready()` as soon as your app's initial UI is stable and ready to be displayed to hide the splash screen.
    *   Optimise initial load times by following web performance best practices (code splitting, asset optimisation).
    *   Use `sdk.isInMiniApp()` to reliably detect if running within a Mini App context, especially for hybrid apps.
5.  **Authentication**:
    *   Use `sdk.quickAuth.getToken()` or `sdk.quickAuth.fetch()` for easy and secure user authentication via JWTs. Validate JWTs on your server.
    *   Alternatively, use `sdk.actions.signIn()` for the standard Sign In with Farcaster (SIWF) flow. Ensure server-side verification of the SIWF message.
    *   Support Auth Addresses by setting `acceptAuthAddress: true` in `signIn` options if applicable.
6.  **Wallet Interactions**:
    *   **Ethereum**: Use `sdk.wallet.getEthereumProvider()` to get an EIP-1193 provider. Consider using libraries like Wagmi with the `@farcaster/frame-wagmi-connector`.
    *   **Solana**: Use `sdk.wallet.getSolanaProvider()` or the `@farcaster/mini-app-solana` package for Wallet Standard integration, often with Wallet Adapter.
    *   Clearly communicate transaction details to users and handle potential errors.
7.  **Notifications**:
    *   If using notifications, set up a server endpoint for the `webhookUrl` defined in your manifest.
    *   Securely store `notificationToken` and `notificationUrl` received via webhooks (`frame_added`, `notifications_enabled`).
    *   Handle `frame_removed` and `notifications_disabled` events to invalidate tokens.
    *   Verify webhook event signatures using `@farcaster/frame-node` or similar.
    *   Use a stable `notificationId` for idempotency when sending notifications. Be mindful of rate limits.
8.  **SDK Actions**:
    *   Familiarise yourself with available SDK actions (e.g., `composeCast`, `openUrl`, `viewProfile`, `addMiniApp`, `close`).
    *   Handle potential errors (e.g., `RejectedByUser`) from SDK actions.
9.  **Context and Capabilities**:
    *   Utilise `sdk.context` to get information about the user, client, and launch location (e.g., `cast_embed`, `notification`, `launcher`, `cast_share`).
    *   Use `sdk.getCapabilities()` and `sdk.getChains()` for runtime detection of host features if your app has optional integrations.
10. **Share Extensions**:
    *   Implement `castShareUrl` in your manifest to allow users to share casts directly to your app.
    *   Handle URL parameters (`castHash`, `castFid`, `viewerFid`) and SDK context (`sdk.context.location.type === 'cast_share'`) to process shared casts.
11. **Back Navigation**:
    *   Integrate with client-provided back navigation using `sdk.back.enableWebNavigation()` for browser history or `sdk.back.onback` for custom handling.
    *   Show/hide the back control using `sdk.back.show()` and `sdk.back.hide()` as appropriate.
12. **Haptics**:
    *   Use `sdk.haptics` methods (`impactOccurred`, `notificationOccurred`, `selectionChanged`) sparingly to provide tactile feedback, enhancing user experience. Check for capability first.
13. **Design and UI**:
    *   Adhere to the recommended size and orientation for Mini Apps (vertical modal, 424x695px on web).
    *   Use `safeAreaInsets` from `sdk.context.client` to avoid UI obstruction by native navigation elements.
14. **Security and Data Handling**:
    *   Treat user data from `sdk.context.user` as untrusted for display purposes; always verify authoritative data via authenticated server calls.
    *   Securely handle nonces for SIWF and other cryptographic operations.
15. **Caching**: Be aware of caching behaviours for `farcaster.json` and `fc:frame` meta tags by Farcaster clients. For dynamic embed images, use appropriate `Cache-Control` headers.

---

Remember to keep this document updated as conventions evolve or new tools are introduced.
