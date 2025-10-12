import { main } from "./processor";

async function cli() {
  try {
    // 传递实际的命令行参数（跳过 node 和脚本路径）
    await main(process.argv.slice(2));
  } catch (error) {
    // 更友好的错误提示
    console.error("发生错误:", (error as Error).message);
    process.exit(1);
  }
}

cli();
