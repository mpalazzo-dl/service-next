#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";
import { execSync } from "child_process";

const projectName = "contentful-kb";
const targetDir = process.cwd();

setupContentfulWeb(targetDir, projectName);

interface Answers {
  appName: string;
  spaceId: string;
  env: string;
  accessToken: string;
  previewToken: string;
  cmaToken: string;
  gtmId: string;
}

async function setupContentfulWeb(targetDir: string, projectName: string) {
  console.log(
    chalk.blueBright.bold(
      "\n🚀 You'll need the following Contentful credentials:",
    ),
  );
  console.log(`- Space ID`);
  console.log(`- Access Token (Content Delivery API)`);
  console.log(`- Preview Access Token (Content Preview API)`);
  console.log(`- CMA Token (Content Management API)\n`);
  console.log(
    chalk.underline(
      "📘 Learn more: https://www.contentful.com/developers/docs/references/content-delivery-api/",
    ),
  );

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Do you have these ready?",
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(
      chalk.yellow(
        "❌ Setup cancelled. Please gather your Contentful credentials first.",
      ),
    );
    process.exit(1);
  }

  const answers = await inquirer.prompt<Answers>([
    {
      type: "input",
      name: "spaceId",
      message: "Contentful Space ID:",
      validate: (input) => input.length > 0 || "Required",
    },
    {
      type: "input",
      name: "env",
      message: "Contentful Space Environment:",
      default: "master",
      validate: (input) => input.length > 0 || "Required",
    },
    {
      type: "password",
      name: "accessToken",
      message: "Contentful Access Token:",
      validate: (input) => input.length > 0 || "Required",
    },
    {
      type: "password",
      name: "previewToken",
      message: "Contentful Preview Access Token:",
      validate: (input) => input.length > 0 || "Required",
    },
    {
      type: "password",
      name: "cmaToken",
      message: "Contentful CMA Token:",
      validate: (input) => input.length > 0 || "Required",
    },
    {
      type: "input",
      name: "gtmId",
      message: "GTM ID (optional):",
      default: "",
    },
  ]);

  const envContent = `NEXT_PUBLIC_CF_GTM_ID=${answers.gtmId}
NEXT_PUBLIC_CF_GRAPHQL_URL=https://graphql.contentful.com/content/v1/spaces
NEXT_PUBLIC_CF_APP_ID=${projectName}
NEXT_PUBLIC_CF_SPACE=${answers.spaceId}
NEXT_PUBLIC_CF_ENVIRONMENT=${answers.env}
NEXT_PUBLIC_CF_ACCESS_TOKEN=${answers.accessToken}
NEXT_PUBLIC_CF_PREVIEW_ACCESS_TOKEN=${answers.previewToken}
NEXT_CF_MANAGEMENT_TOKEN=${answers.cmaToken}
NEXT_PUBLIC_SITE_URL=http://localhost:3000
`.trim();

  fs.writeFileSync(path.join(targetDir, ".env"), envContent);
  console.log("✅ .env.local created with Contentful credentials.");

  try {
    console.log(chalk.blue("📥 Importing Contentful models..."));
    execSync("npm run import-models-only", {
      stdio: "inherit",
      cwd: targetDir,
    });

    console.log(chalk.blue("📥 Importing Contentful content..."));
    execSync("npm run import-content", { stdio: "inherit", cwd: targetDir });

    console.log(
      chalk.greenBright.bold("\n🎉 Your ACES Contentful Website is ready!"),
    );

    console.log(`👉 Next steps:
  ${chalk.cyan(`cd ${projectName}`)}
  ${chalk.cyan("npm run dev")}

🔗 Docs: https://github.com/your-org/aces-docs
`);
  } catch (err) {
    console.error(chalk.red("❌ An error occurred during setup:"), err);
    process.exit(1);
  }
}
