# Cognitive Psychology Experiment

A web-based experiment for cognitive psychology research featuring N-back task and prospective memory cues.

## Project Overview

This experiment presents participants with a series of images across three emotional categories (pleasant, neutral, unpleasant) and measures their performance on:

1. An N-back task (identifying when images repeat)
2. A prospective memory task (responding to special cue images)

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Installation

1. Clone this repository
```sh
git clone https://github.com/n4bi10p/cognitive-cue-carousel.git
cd cognitive-cue-carousel
```

2. Install dependencies
```sh
npm install
# or
yarn install
```

3. Start the development server
```sh
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Working with Images

### Image Structure

Images are organized in the following directories:

```
public/images/
├── pleasant/              - Pleasant category images
├── neutral/               - Neutral category images
├── unpleasant/            - Unpleasant category images
└── pmcues/                - PM cue images 
    ├── pleasantcues/      - Pleasant PM cues
    ├── neutralcues/       - Neutral PM cues
    └── unpleasantcues/    - Unpleasant PM cues
```

### Adding Your Own Images

1. Place your image files in the appropriate subdirectory following this naming convention:
   - Pleasant images: `pleasant1.jpg`, `pleasant2.jpg`, etc.
   - Neutral images: `neutral1.jpg`, `neutral2.jpg`, etc. 
   - Unpleasant images: `unpleasant1.jpg`, `unpleasant2.jpg`, etc.
   - PM cues:
     - Pleasant PM cues: `pleasantcue1.jpg`, `pleasantcue2.jpg`, etc.
     - Neutral PM cues: `neutralcue1.jpg`, `neutralcue2.jpg`, etc.
     - Unpleasant PM cues: `unpleasantcue1.jpg`, `unpleasantcue2.jpg`, etc.

2. The experiment will automatically use your images during trials

For image requirements and more details, see `public/images/README.md`.

## Building for Production

To build the application for production:

```sh
npm run build
# or
yarn build
```

The built files will be in the `dist` directory and can be deployed to any static hosting service.

## Technologies Used

This project is built with:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## License

This project is licensed under the MIT License - see the LICENSE file for details.
