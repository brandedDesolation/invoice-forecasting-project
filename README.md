# Vic.ai Clone - Frontend

A modern, responsive clone of the Vic.ai website built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🎨 Modern, beautiful UI with gradient effects and animations
- 📱 Fully responsive design
- ⚡ Built with Next.js 14 for optimal performance
- 🎭 Smooth animations using Tailwind CSS and Framer Motion
- 🎯 TypeScript for type safety
- 🎨 Tailwind CSS for styling
- 📦 Component-based architecture

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animations:** Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
cd vicai
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
vicai/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/
│   ├── Header.tsx       # Navigation header
│   ├── Hero.tsx         # Hero section
│   ├── Products.tsx     # Products showcase
│   ├── AchieveSection.tsx
│   ├── RolesSection.tsx
│   ├── Testimonials.tsx
│   ├── Integrations.tsx
│   ├── Resources.tsx
│   ├── CTA.tsx          # Call to action
│   └── Footer.tsx       # Footer
├── public/              # Static assets
└── package.json
```

## Components

### Header
- Responsive navigation with dropdown menus
- Mobile menu support
- Announcement banner
- CTA buttons

### Hero
- Animated hero section with gradient backgrounds
- Key statistics display
- Video/demo placeholder
- Call-to-action buttons

### Products
- Three main product cards
- Hover effects and animations
- Icon integration

### AchieveSection
- Statistics grid
- Benefits list with checkmarks
- Gradient decorative elements

### RolesSection
- Three role-specific sections (CFO, Controller, AP Manager)
- Benefit icons and descriptions
- Responsive grid layout

### Testimonials
- Customer quotes
- Statistics integration
- Two-column layout

### Integrations
- ERP systems grid
- Central connection visual
- Hover effects

### Resources
- Four featured resources
- Different resource types (Case Study, Guide, Webinar)
- Card-based layout

### CTA
- Gradient background
- Pattern overlay
- Dual call-to-action buttons

### Footer
- Newsletter signup
- Multi-column link sections
- Social media links
- Copyright information

## Styling

The project uses Tailwind CSS with custom configurations:

- Custom color palette (primary and accent gradients)
- Custom animations (fade-in, slide-up, scale-in)
- Responsive breakpoints
- Custom utility classes

## Build

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## License

This is a clone project for educational purposes.

## Acknowledgments

- Original design: [Vic.ai](https://www.vic.ai/)
- Icons: [Lucide React](https://lucide.dev/)
- Framework: [Next.js](https://nextjs.org/)


