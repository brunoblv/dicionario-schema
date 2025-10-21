# Prisma Data Dictionary Next.js

This project is a Next.js application that serves as a Prisma Data Dictionary generator. It allows users to input their Prisma schema and generates a structured data dictionary in markdown format, which can be copied or exported as a PDF.

## Project Structure

```
prisma-data-dictionary-next
├── app
│   ├── page.tsx                # Main entry point for the application
│   └── PrismaDataDictionary.tsx # Component for generating the data dictionary
├── public                       # Directory for static assets
├── styles
│   └── globals.css             # Global CSS styles
├── .gitignore                  # Specifies files to ignore in Git
├── package.json                # npm configuration file
├── tsconfig.json               # TypeScript configuration file
├── next.config.js              # Next.js configuration settings
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── next-env.d.ts               # TypeScript definitions for Next.js
└── README.md                   # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd prisma-data-dictionary-next
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

## Usage

- Paste your Prisma schema into the input area of the application.
- Click on "Gerar Dicionário de Dados" to generate the data dictionary.
- You can copy the generated markdown or export it as a PDF.

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.