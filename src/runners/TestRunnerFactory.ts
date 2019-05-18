import { exists } from "fs";
import { join } from "path";
import { WorkspaceFolder } from "vscode";

import { ITestRunnerInterface } from "../interfaces/ITestRunnerInterface";
import { ConfigurationProvider } from "../providers/ConfigurationProvider";
import { TerminalProvider } from "../providers/TerminalProvider";
import { AvaTestRunner } from "./AvaTestRunner";
import { JestTestRunner } from "./JestTestRunner";
import { MochaTestRunner } from "./MochaTestRunner";

const terminalProvider = new TerminalProvider();

function doesFileExist(filePath: string): Promise<boolean> {
  return new Promise(resolve => {
    exists(filePath, doesExist => {
      resolve(doesExist);
    });
  });
}

async function getAvailableTestRunner(
  testRunners: ITestRunnerInterface[],
  rootPath: WorkspaceFolder,
  configTestRunner: string
): Promise<ITestRunnerInterface> {
  for (const runner of testRunners) {
    if (configTestRunner && runner.name === configTestRunner) {
      return runner;
    }
  }

  for (const runner of testRunners) {
    const doesRunnerExist = await doesFileExist(
      join(rootPath.uri.path, runner.binPath)
    );

    if (doesRunnerExist) {
      return runner;
    }
  }

  throw new Error("No test runner in your project. Please install one.");
}

export async function getTestRunner(
  rootPath: WorkspaceFolder
): Promise<ITestRunnerInterface> {
  const configurationProvider = new ConfigurationProvider(rootPath);

  const jestTestRunner = new JestTestRunner({
    configurationProvider,
    terminalProvider
  });
  const mochaTestRunner = new MochaTestRunner({
    configurationProvider,
    terminalProvider
  });
  const avaTestRunner = new AvaTestRunner({
    configurationProvider,
    terminalProvider
  });

  return getAvailableTestRunner(
    [jestTestRunner, mochaTestRunner, avaTestRunner],
    rootPath,
    configurationProvider.testRunner
  );
}
