# Morpher Trading Farcaster Mini App

**[Try it on Farcaster](https://farcaster.xyz/miniapps/dWezHCjv5UqF/morpher)**

This is a Farcaster Mini App for the Morpher Trading platform. It allows users to trade a wide variety of markets, including stocks, forex, commodities, and indices, directly from within Farcaster clients like Warpcast.

## ✨ Features

-   **Seamless Trading**: Open and close long or short positions on any market.
-   **Farcaster Integration**: Built as a Mini App using the Farcaster SDK for a native in-client experience.
-   **Wallet Connection**: Integrates with user wallets via Wagmi for secure on-chain transactions.
-   **Market Insights**: View real-time price charts for different time ranges (1D, 1W, 1M, etc.).
-   **Position Management**: View your current positions, including PnL, entry price, and leverage.
-   **Intuitive UI**: A clean and modern user interface built with React, TypeScript, Shadcn/ui, and Tailwind CSS.

## 📸 Screenshots

| Main Screen | Trade Screen | Leverage Selector |
| :---: | :---: | :---: |
| <img src="https://farcaster.morpher.com/assets/screenshots/mainscreen.png" alt="Main trading screen" width="250"> | <img src="https://farcaster.morpher.com/assets/screenshots/tradeabnb.png" alt="Trading BNB" width="250"> | <img src="https://farcaster.morpher.com/assets/screenshots/shortleverage.png" alt="Short leverage selection" width="250"> |

## 🛠️ Tech Stack

-   **Framework**: [React](https://react.dev/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
-   **Wallet Integration**: [Wagmi](https://wagmi.sh/)
-   **Farcaster Integration**: [@farcaster/miniapp-sdk](https://github.com/farcasterxyz/frames)
-   **Trading Logic**: Morpher Trading SDK

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) or another package manager like pnpm or yarn

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project. At a minimum, you will need to define the Morpher API endpoint.

    ```env
    # Morpher Trading SDK
    VITE_MORPHER_API_ENDPOINT=http://localhost:3001
    ```

### Running the Development Server

To start the Vite development server, run:

```bash
npm run dev
```

This will start the application on a local development server. To preview the Mini App within a Farcaster client, you can use a tool like `ngrok` to expose your local server to the internet and then use the Farcaster Mini App Debug Tool.

## 📁 Project Structure

-   `public/`: Static assets and the `farcaster.json` manifest.
-   `src/`: Main source code.
    -   `assets/`: Icons and other static assets.
    -   `components/`: Reusable React components.
        -   `app/`: Core application components (e.g., Header).
        -   `layout/`: Layout components.
        -   `magicui/`, `ui/`: UI library components (Magic UI, Shadcn).
        -   `trade/`: Components specific to the trading interface.
    -   `lib/`: Utility functions.
    -   `screens/`: Top-level screen components.
    -   `store/`: State management stores (Zustand).
    -   `main.tsx`: Application entry point.
    -   `wagmi.ts`: Wagmi configuration.
-   `tailwind.config.ts`: Tailwind CSS configuration.
-   `vite.config.ts`: Vite configuration.
