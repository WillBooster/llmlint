import * as fs from 'node:fs';

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { PromptTemplate } from 'langchain/prompts';
import { HumanMessage } from 'langchain/schema';
import yargs from 'yargs';

const argv = await yargs(process.argv.slice(2))
  .command('$0 [paths..]', 'Lint given code files with LLM', (yargs) => {
    yargs.positional('paths', {
      describe: 'File paths of source code to be linted',
      array: true,
      type: 'string',
    });
  })
  .options({
    verbose: {
      description: 'Whether or not to enable verbose mode',
      type: 'boolean',
      default: false,
      alias: 'v',
    },
  })
  .strict().argv;

const prompt = PromptTemplate.fromTemplate<{ code: string }>(
  `
Act as a linter for source code, judge whether each function in the given code follow the guidelines or not.
If the function does not follow the guidelines, explain the reason and suggest a new function name which follows the guidelines (G1-G5).

- Function names should be informative.
- Function names should be easy to understand.
- Function names should explain what they do with domain-specific vocabulary.
- Function should consist of semantically related statements.
- Function should abstract away implementation details which is not important to understand the code block containing the function call.
- Function should make code readers easy to understand code with function calls in comparison to code with inlined function.

# Code
{code}

# Output format
[ {{ name: string, isFollowed: boolean, reason?: string, suggested?: string }} ]
`.trim()
);

const chat = new ChatOpenAI({
  temperature: 0,
});

for (const filePath of argv.paths as string[]) {
  const result = await chat.predictMessages([
    new HumanMessage(
      await prompt.format({
        code: await fs.promises.readFile(filePath, 'utf8'),
      })
    ),
  ]);
  console.info(result);
}
