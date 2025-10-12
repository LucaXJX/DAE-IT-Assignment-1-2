import * as fs from "fs"; // sync version
import * as fsPromises from "fs/promises"; // async version (Promise-based fs API)
import * as path from "path";
import { splitBill, BillInput, BillOutput } from "./core";

/**
 * 主程式入口點
 * @param args 命令列參數陣列
 * @description 解析命令列參數並執行相應的處理邏輯，支援單一檔案和批次處理模式
 */
export function parseArgs(args: string[]): {
  input: string;
  output: string;
  format?: "json" | "text"; // 明确类型
} {
  const params: Partial<{
    input: string;
    output: string;
    format: "json" | "text";
  }> = {};
  args.forEach((arg) => {
    if (arg.startsWith("--input=")) params.input = arg.split("=")[1];
    if (arg.startsWith("--output=")) params.output = arg.split("=")[1];
    if (arg.startsWith("--format=")) {
      const fmt = arg.split("=")[1];
      if (fmt === "json" || fmt === "text") {
        params.format = fmt;
      } else {
        throw new Error("format 只能是 'json' 或 'text'");
      }
    }
  });
  if (!params.input || !params.output)
    throw new Error("缺少--input或--output参数");
  return params as { input: string; output: string; format?: "json" | "text" };
}

// 類型校驗函數
function isBillInput(data: unknown): data is BillInput {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const bill = data as BillInput;

  // 檢驗輸入（date、location、tipPercentage、items）
  const hasRequiredTopLevelFields =
    "date" in bill &&
    typeof bill.date === "string" &&
    "location" in bill &&
    typeof bill.location === "string" &&
    "tipPercentage" in bill && // 檢驗tipPercentage
    typeof bill.tipPercentage === "number" && // 確保是數字
    "items" in bill &&
    Array.isArray(bill.items);

  if (!hasRequiredTopLevelFields) {
    return false;
  }

  // 檢驗items數組中每個元素的結構
  return bill.items.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      typeof item.name === "string" &&
      "price" in item && // 注意：輸入項是price，不是amount
      typeof item.price === "number" &&
      "isShared" in item &&
      typeof item.isShared === "boolean" &&
      // 非共享項必須包含person字段
      (!item.isShared
        ? "person" in item && typeof item.person === "string"
        : true)
  );
}

// 讀取單個文件 - 只保留带類型校驗的版本
async function readInputFile(filePath: string): Promise<BillInput> {
  try {
    const content = await fsPromises.readFile(filePath, "utf-8");
    const data = JSON.parse(content);
    if (!isBillInput(data)) {
      throw new Error(`文件 ${filePath} 格式不符合 BillInput 要求`);
    }
    return data;
  } catch (err) {
    throw new Error(`讀取文件失敗：${(err as Error).message}`);
  }
}

// 讀取路徑中的所有JSON文件（批次處理）
async function readInputDir(
  dirPath: string
): Promise<{ filePath: string; data: BillInput }[]> {
  const files = await fsPromises.readdir(dirPath);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));
  return Promise.all(
    jsonFiles.map(async (file) => {
      const fullPath = path.join(dirPath, file);
      return { filePath: fullPath, data: await readInputFile(fullPath) };
    })
  );
}

function processData(input: BillInput): BillOutput {
  return splitBill(input); // 再次使用ASM1核心邏輯
}

function formatAsText(output: BillOutput): string {
  let text = `${output.date} ${output.location}\n`;
  text += `小計: ${output.subTotal} HKD, 小費: ${output.tip} HKD, 共計: ${output.totalAmount} HKD\n`;
  text += "個人應付:\n";
  output.items.forEach((item) => {
    text += `${item.name}: ${item.amount} HKD\n`;
  });
  return text;
}

// 寫入單個文件
async function writeOutputFile(
  filePath: string,
  data: BillOutput,
  format: "json" | "text" = "json"
): Promise<void> {
  const content =
    format === "json" ? JSON.stringify(data, null, 2) : formatAsText(data);
  // 確保輸出目錄存在
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
  await fsPromises.writeFile(filePath, content, "utf-8");
}

export async function main(args: string[]): Promise<void> {
  try {
    const { input, output, format = "json" } = parseArgs(args);
    const isInputDir = (await fsPromises.stat(input)).isDirectory();
    // 將輸出目錄判斷移到main函數內部
    const outputStat = await fsPromises.stat(output).catch(() => null);
    const isOutputDir = outputStat?.isDirectory() ?? false;

    if (isInputDir) {
      // 批次處理目錄
      const inputFiles = await readInputDir(input);
      for (const { filePath, data } of inputFiles) {
        const result = processData(data);
        // 輸出文件名和輸入文件名對應，放入輸出目錄
        const fileName = path.basename(filePath);
        const outputPath = path.join(
          output,
          fileName.replace(".json", format === "json" ? ".json" : ".txt")
        );
        await writeOutputFile(outputPath, result, format as "json" | "text");
      }
    } else {
      // 處理單個文件
      const data = await readInputFile(input);
      const result = processData(data);
      const outputPath = isOutputDir
        ? path.join(
            output,
            path
              .basename(input)
              .replace(".json", format === "json" ? ".json" : ".txt")
          )
        : output;
      await writeOutputFile(outputPath, result, format as "json" | "text");
    }
    console.log("處理完成");
  } catch (err) {
    console.error("錯誤:", (err as Error).message);
    process.exit(1);
  }
}
