# Conventions and Best Practices

This document outlines the coding conventions and best practices to be followed in this project.

## React

1.  **Component Naming**: Use PascalCase for component names (e.g., `MyComponent`). File names should match the component name (e.g., `MyComponent.tsx`).
2.  **Functional Components and Hooks**: Prefer functional components and hooks over class components.
3.  **Props**:
    *   Use clear and descriptive prop names.
    *   Destructure props at the beginning of the component.
    *   Define prop types using TypeScript interfaces or types.
4.  **State Management**:
    *   Use the `useState` hook for local component state.
    *   For more complex state management, consider `useReducer` or a dedicated state management library (e.g., Zustand, Redux Toolkit) if the project scales.
5.  **Side Effects**: Manage side effects using the `useEffect` hook. Remember to include a dependency array to control when the effect runs. Clean up any subscriptions or event listeners in the return function of `useEffect`.
6.  **File Structure**: Organise components logically, for example, by feature or by type (e.g., `components/`, `features/`, `pages/`).
7.  **JSX**:
    *   Keep JSX readable. If a component's render logic becomes too complex, break it down into smaller components.
    *   Use parentheses for multi-line JSX.
8.  **Keys**: Always provide a unique `key` prop when rendering lists of elements.
9.  **Immutability**: Treat state and props as immutable. When updating state based on previous state, use the functional update form of `setState`.
10. **Code Splitting**: Use `React.lazy` and `Suspense` for code-splitting to improve initial load times for larger applications.
11. **Error Boundaries**: Implement error boundaries to catch JavaScript errors in their child component tree and display a fallback UI.
12. **Accessibility (a11y)**: Write accessible components by using semantic HTML, ARIA attributes where necessary, and ensuring keyboard navigability.

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

## Magic UI

1.  **Installation and Usage**: Follow the official Magic UI documentation for integrating components.
2.  **Customisation**: Magic UI components are designed to be customisable. Leverage the props and styling options provided.
3.  **Animation and Interactivity**:
    *   Use animations purposefully to enhance user experience, not distract from it.
    *   Ensure animations are performant and smooth.
4.  **Responsiveness**: Test Magic UI components across different screen sizes and devices to ensure they are responsive and adapt well.
5.  **Accessibility**: As with any UI component, ensure that the use of Magic UI components does not negatively impact the accessibility of your application. Test with screen readers and keyboard navigation.
6.  **Bundle Size**: Be mindful of the bundle size impact of any UI library. Magic UI often focuses on modern, visually rich components, so ensure you are only using what you need and that it's optimised.
7.  **Integration with Tailwind/Shadcn**:
    *   Magic UI components can often be styled or augmented using Tailwind CSS utility classes.
    *   They can be composed alongside Shadcn/ui components to build rich interfaces. Ensure consistent styling and behaviour when mixing components from different libraries.
8.  **Props and API**: Familiarise yourself with the props and API of each Magic UI component you use to leverage its full potential and customise it effectively.

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
