# Mobile App Flows — Marvel Ogbeide

Five multi-screen mobile app flows built in plain JavaScript, HTML and CSS, with no framework.

**Live:** [marvel-ogbeide.vercel.app](https://marvel-ogbeide.vercel.app). Tap any app to open it.

| App | What it is | Highlights |
| --- | --- | --- |
| **Waka** | Lagos delivery app, 9 screens | Phone sign-in with a one-time code, route and price on a map, live rider tracking, draggable bottom sheet |
| **Kobo** | Spending tracker, 8 screens | Custom keypad that logs an expense in three taps, animated canvas chart, all screens read from one state object |
| **Luma** | Salon booking, 11 screens | Availability logic that blocks double bookings, plus reschedule and cancel |
| **Crema** | Coffee order-ahead, 9 screens | Drink builder with live pricing, bag with tax, prices in USD, EUR and GBP via `Intl.NumberFormat` |
| **Synapse** | Neural network from scratch, 5 screens | Forward pass, backpropagation and the Adam optimiser written by hand, training live in the browser |

## How it's built

- **`kit.js`** is a small shared app shell. `App(root, options)` builds one app from a config of screens, tabs and starting state. It owns the navigation stack (push, pop, tab fade), bottom sheets, toasts and cleanup when a screen closes. Each app passes in what it needs rather than extending a base class, so all five reuse the same shell.
- **`h(tag, attrs, ...children)`** is a tiny helper for building DOM elements, used instead of JSX.
- Each app (`kobo.js`, `waka.js`, …) is one file that holds its screens, data and logic, with styles in a matching `.css` file.
- **`synapse.js`** keeps the network maths (`createNet`, `forward`, `train`) separate from the UI, so it can be tested in Node.

## Run it

Open `index.html` in a browser. There's no build step.

## Tests

```bash
node --test
```

These run `synapse.test.js`, which checks that the network's output is a valid probability, that the same seed always builds the same network, and that training lowers the loss and reaches at least 90% accuracy on the rings dataset.

## Also by me

- **Jamb 4 Skill Checker** (React, TypeScript, Supabase): [jamb-skill-checker.vercel.app](https://jamb-skill-checker.vercel.app)
- **JAMB Quest**: an exam-prep app in React Native, Expo and Expo Router with Supabase auth (in progress)
