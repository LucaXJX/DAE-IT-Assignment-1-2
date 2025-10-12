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

