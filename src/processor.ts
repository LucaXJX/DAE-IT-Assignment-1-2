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

// 驗證 BillInput 格式並拋出具體錯誤訊息
function validateBillInput(
  data: unknown,
  filePath: string
): asserts data is BillInput {
  if (typeof data !== "object" || data === null) {
    throw new Error("invalid JSON file");
  }

  const bill = data as BillInput;

  // 檢查頂層必要欄位
  if (!("date" in bill) || typeof bill.date !== "string") {
    throw new Error("missing date field in bill object");
  }

  if (!("location" in bill) || typeof bill.location !== "string") {
    throw new Error("missing location field in bill object");
  }

  if (!("tipPercentage" in bill) || typeof bill.tipPercentage !== "number") {
    throw new Error("missing tipPercentage field in bill object");
  }

  if (!("items" in bill) || !Array.isArray(bill.items)) {
    throw new Error("missing items field in bill object");
  }

  // 檢查 items 陣列中的每個元素
  bill.items.forEach((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`invalid item at index ${index} in items array`);
    }

    if (!("name" in item) || typeof item.name !== "string") {
      throw new Error(
        `missing name field in bill object items array at index ${index}`
      );
    }

    if (!("price" in item) || typeof item.price !== "number") {
      throw new Error(
        `missing price field in bill object items array at index ${index}`
      );
    }

    if (!("isShared" in item) || typeof item.isShared !== "boolean") {
      throw new Error(
        `missing isShared field in bill object items array at index ${index}`
      );
    }

    // 如果是個人項目，必須有 person 欄位
    if (
      item.isShared === false &&
      (!("person" in item) || typeof item.person !== "string")
    ) {
      throw new Error(
        `missing person field in bill object items array at index ${index}`
      );
    }
  });
}

/**
 * 讀取 JSON 檔案並解析
 * @param filePath 檔案路徑
 * @returns 解析後的資料
 */
export async function readJSONFile(filePath: string): Promise<any> {
  try {
    // 檢查檔案是否存在
    await fsPromises.access(filePath);
  } catch (err) {
    throw new Error(`input file not found: ${filePath}`);
  }

  try {
    const content = await fsPromises.readFile(filePath, "utf-8");

    // 檢查是否為空檔案
    if (content.trim() === "") {
      throw new Error("input file is empty");
    }

    // 嘗試解析 JSON
    let data;
    try {
      data = JSON.parse(content);
    } catch (parseErr) {
      throw new Error("invalid JSON file");
    }

    // 驗證格式
    validateBillInput(data, filePath);

    return data;
  } catch (err) {
    if ((err as Error).message.includes("input file not found")) {
      throw err;
    }
    if ((err as Error).message.includes("input file is empty")) {
      throw err;
    }
    if ((err as Error).message.includes("invalid JSON file")) {
      throw err;
    }
    if (
      (err as Error).message.includes("missing") ||
      (err as Error).message.includes("invalid")
    ) {
      throw err;
    }
    throw err;
  }
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
