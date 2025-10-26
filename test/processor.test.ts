import { expect } from "chai";
import { main, readJSONFile, writeJSONFile } from "../src/processor";
import * as fs from "fs";
import * as path from "path";
import * as sinon from "sinon";
import * as core from "../src/core";
import { BillOutput } from "../src/core";

describe("Processor", () => {
  let inputFile = "sample-data/single-bill.json";
  let outputFile = "result.json";

  let inputDir = "sample-data/input-dir";
  let outputDir = "sample-data/output-dir";

  // ===== 功能擴展與核心邏輯（40 分） =====

  describe("重用習作一計算函數（15 分）", () => {
    it("正確調用習作一的核心計算邏輯", async () => {
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${outputFile}`,
      ];
      const splitBillSpy = sinon.spy(core, "splitBill");
      try {
        await main(testArgs);
        expect(splitBillSpy.calledOnce).to.be.true;
      } finally {
        splitBillSpy.restore();
      }
    });

    it("保持計算結果的一致性", () => {
      let assignment_1_file = "../DAE-IT-Assignment-1/src/core.ts";
      let assignment_2_file = "../DAE-IT-Assignment-2/src/core.ts";

      let assignment_1_content = fs.readFileSync(assignment_1_file, "utf-8");
      let assignment_2_content = fs.readFileSync(assignment_2_file, "utf-8");

      expect(assignment_1_content).to.equals(assignment_2_content);
    });
  });

  describe("單一檔案處理能力（15 分）", () => {
    it("支援處理單筆聚餐分帳資料（完整工作流程：讀取、處理、輸出）", async () => {
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${outputFile}`,
      ];

      // Mock the splitBill function to return a simple output
      const mockOutput = {
        date: "2024年3月21日",
        location: "開心小館",
        subTotal: 100,
        tip: 10,
        totalAmount: 110,
        items: [
          { name: "Alice", amount: 55 },
          { name: "Bob", amount: 55 },
        ],
      };

      const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

      try {
        // Clean up any existing output file
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }

        // Call main function
        await main(testArgs);

        // Verify output file was created
        expect(fs.existsSync(outputFile)).to.be.true;

        // Read and verify the actual file content
        const fileContent = fs.readFileSync(outputFile, "utf-8");
        const writtenData = JSON.parse(fileContent);
        expect(writtenData).to.deep.equal(mockOutput);
      } finally {
        splitBillStub.restore();
        // Clean up output file
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      }
    });
  });

  describe("命令列參數解析（10 分）", () => {
    function prepare(args: { inputFile: string; outputFile: string }) {
      let { inputFile, outputFile } = args;
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${outputFile}`,
      ];
      const mockOutput = {
        date: "2024年3月21日",
        location: `${inputFile} -> ${outputFile}`,
        subTotal: 100,
        tip: 0.1,
        totalAmount: 110,
        items: [
          { name: "input: " + inputFile, amount: 55 },
          { name: "output: " + outputFile, amount: 55 },
        ],
      };
      const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }

      return { testArgs, splitBillStub, mockOutput };
    }

    it("支援 --input 和 --output 參數", async () => {
      let args = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${outputFile}`,
      ];
      // it should not throw error
      await main(args);
    });

    it("正確解析 --input 命令列參數", async () => {
      async function test(args: {
        inputFile: string;
        outputFile: string;
        location: string;
      }) {
        let { testArgs, splitBillStub } = prepare(args);
        try {
          await main(testArgs);
          expect(splitBillStub.calledOnce).to.be.true;
          expect(splitBillStub.getCall(0).args[0].location).to.be.equal(
            args.location
          );
        } finally {
          splitBillStub.restore();
          if (fs.existsSync(args.outputFile)) {
            fs.unlinkSync(args.outputFile);
          }
        }
      }

      await test({
        inputFile: path.join(inputDir, "bill-1.json"),
        outputFile: path.join(outputDir, "result-1.json"),
        location: "開心小館",
      });
      await test({
        inputFile: path.join(inputDir, "bill-2.json"),
        outputFile: path.join(outputDir, "result-2.json"),
        location: "美味餐廳",
      });
      await test({
        inputFile: path.join(inputDir, "bill-3.json"),
        outputFile: path.join(outputDir, "result-3.json"),
        location: "咖啡廳",
      });
    });

    it("正確解析 --output 命令列參數", async () => {
      async function test(args: { inputFile: string; outputFile: string }) {
        let { testArgs, splitBillStub, mockOutput } = prepare(args);
        try {
          await main(testArgs);
          expect(fs.existsSync(args.outputFile)).to.be.true;
          let fileOutput = JSON.parse(
            fs.readFileSync(args.outputFile, "utf-8")
          );
          expect(fileOutput).to.deep.equal(mockOutput);
        } finally {
          splitBillStub.restore();
          if (fs.existsSync(args.outputFile)) {
            fs.unlinkSync(args.outputFile);
          }
        }
      }

      await test({
        inputFile: path.join(inputDir, "bill-1.json"),
        outputFile: path.join(outputDir, "result-1.json"),
      });
      await test({
        inputFile: path.join(inputDir, "bill-2.json"),
        outputFile: path.join(outputDir, "result-2.json"),
      });
      await test({
        inputFile: path.join(inputDir, "bill-3.json"),
        outputFile: path.join(outputDir, "result-3.json"),
      });
    });
  });

  // ===== 檔案 I/O 處理（30 分） =====

  describe("JSON 檔案讀取（10 分）", () => {
    it("正確讀取和解析 JSON 檔案 ", async () => {
      // test if a small json file
      let file = path.join(inputDir, "bill-2.json");
      let data = await readJSONFile(file);
      expect(data).to.deep.equal({
        date: "2024-03-22",
        location: "美味餐廳",
        tipPercentage: 10,
        items: [
          {
            name: "義大利麵",
            price: 120,
            isShared: false,
            person: "Charlie",
          },
        ],
      });

      // test if another file to avoid hardcode
      file = path.join(inputDir, "bill-3.json");
      data = await readJSONFile(file);
      expect(data).to.deep.equal({
        date: "2024-03-23",
        location: "咖啡廳",
        tipPercentage: 15,
        items: [
          { name: "拿鐵咖啡", price: 45, isShared: false, person: "Alice" },
          { name: "美式咖啡", price: 35, isShared: false, person: "Bob" },
          { name: "蛋糕", price: 60, isShared: true },
        ],
      });
    });

    it("處理檔案路徑和權限問題", async () => {
      // test if the file does not exist
      let file = path.join(inputDir, "bill-4.json");
      let error = null;
      try {
        await readJSONFile(file);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.an.instanceof(Error);
      expect(String(error)).to.include("input file not found");
    });
  });

  describe("檔案寫入（10 分）", () => {
    const testOutputFile = "test-output.json";
    const testData = {
      date: "2024年3月21日",
      location: "測試餐廳",
      subTotal: 100,
      tip: 10,
      totalAmount: 110,
      items: [
        { name: "Alice", amount: 55 },
        { name: "Bob", amount: 55 },
      ],
    };
    const testData_json = `{
  "date": "2024年3月21日",
  "location": "測試餐廳",
  "subTotal": 100,
  "tip": 10,
  "totalAmount": 110,
  "items": [
    {
      "name": "Alice",
      "amount": 55
    },
    {
      "name": "Bob",
      "amount": 55
    }
  ]
}`.trim();

    it("正確寫入輸出檔案", async () => {
      // Mock the splitBill function to return our test data
      const splitBillStub = sinon.stub(core, "splitBill").returns(testData);

      try {
        // Clean up any existing test file
        if (fs.existsSync(testOutputFile)) {
          fs.unlinkSync(testOutputFile);
        }

        // Test the main function which includes file writing
        const testArgs = [
          "ts-node",
          "src/cli.ts",
          `--input=${inputFile}`,
          `--output=${testOutputFile}`,
        ];

        await main(testArgs);

        // Verify file was created
        expect(fs.existsSync(testOutputFile)).to.be.true;

        // Verify file content
        const fileContent = fs.readFileSync(testOutputFile, "utf-8");
        const writtenData = JSON.parse(fileContent);
        expect(writtenData).to.deep.equal(testData);
      } finally {
        // Restore the stub for subsequent tests
        splitBillStub.restore();

        // Clean up test file
        if (fs.existsSync(testOutputFile)) {
          fs.unlinkSync(testOutputFile);
        }
      }
    });

    it("支援 JSON 格式的檔案輸出", async () => {
      try {
        // Clean up any existing test file
        if (fs.existsSync(testOutputFile)) {
          fs.unlinkSync(testOutputFile);
        }

        // Test the writeJSONFile function directly
        await writeJSONFile(testOutputFile, testData);

        // Verify file was created
        expect(fs.existsSync(testOutputFile)).to.be.true;

        // Verify file content
        const fileContent = fs.readFileSync(testOutputFile, "utf-8").trim();
        expect(fileContent).to.equals(testData_json);
      } finally {
        // Clean up test file
        if (fs.existsSync(testOutputFile)) {
          fs.unlinkSync(testOutputFile);
        }
      }
    });
  });

  describe("檔案格式驗證（10 分） + 檔案錯誤處理（8 分） + JSON 錯誤處理（7 分） + 程式穩定性（5 分）", () => {
    async function test(file: string) {
      let error = null;
      try {
        await readJSONFile(file);
      } catch (err) {
        error = err;
      }
      return error;
    }
    it("驗證輸入 JSON 格式的正確性", async () => {
      let error = await test(inputFile);
      expect(error).to.be.null;
    });
    describe("處理格式錯誤並提供錯誤訊息", () => {
      let dir = "sample-data/invalid-input";
      it("檔案有效時不應拋出錯誤", async () => {
        let file = path.join(dir, "complete.json");
        let error = await test(file);
        expect(error).to.be.null;
      });
      it("處理空檔案的情況", async () => {
        let file = path.join(dir, "empty.json");
        let error = await test(file);
        expect(error).to.be.an.instanceof(Error);
        expect(String(error)).to.include("input file is empty");
      });
      describe("處理根物件缺少必要欄位 date 的情況", async () => {
        let file = path.join(dir, "missing-date.json");
        let error = await test(file);
        expect(error).to.be.an.instanceof(Error);
        expect(String(error)).to.include("missing date field in bill object");
      });
      describe("處理根物件缺少必要欄位 location 的情況", async () => {
        let file = path.join(dir, "missing-location.json");
        let error = await test(file);
        expect(error).to.be.an.instanceof(Error);
        expect(String(error)).to.include(
          "missing location field in bill object"
        );
      });
      describe("處理根物件缺少必要欄位 tipPercentage 的情況", async () => {
        let file = path.join(dir, "missing-tipPercentage.json");
        let error = await test(file);
        expect(error).to.be.an.instanceof(Error);
        expect(String(error)).to.include(
          "missing tipPercentage field in bill object"
        );
      });
      it("處理項目陣列缺少必要欄位 items 的情況", async () => {
        let file = path.join(dir, "missing-items.json");
        let error = await test(file);
        expect(error).to.be.an.instanceof(Error);
        expect(String(error)).to.include("missing items field in bill object");
      });
      it("處理項目陣列缺少必要欄位 isShared 的情況", async () => {
        let file = path.join(dir, "missing-isShared.json");
        let error = await test(file);
        expect(error).to.be.an.instanceof(Error);
        expect(String(error)).to.include(
          "missing isShared field in bill object items array at index 0"
        );
      });
      it("處理項目陣列缺少必要欄位 person 的情況", async () => {
        let file = path.join(dir, "missing-person.json");
        let error = await test(file);
        expect(error).to.be.an.instanceof(Error);
        expect(String(error)).to.include(
          "missing person field in bill object items array at index 0"
        );
      });
      it("處理無效 JSON 檔案的情況", async () => {
        let file = path.join(dir, "invalid.txt");
        let error = await test(file);
        expect(error).to.be.an.instanceof(Error);
        expect(String(error)).to.include("invalid JSON file");
      });
    });

    describe("提供適當的退出碼", () => {
      it("檢查 CLI 原始碼包含正確的退出碼邏輯", () => {
        const cliSourceCode = fs.readFileSync("src/cli.ts", "utf-8");

        // 檢查是否包含 process.exit(0) 用於成功情況
        expect(cliSourceCode).to.include("process.exit(0)");

        // 檢查是否有 try-catch 結構
        expect(cliSourceCode).to.include("try {");
        expect(cliSourceCode).to.include("} catch (error) {");

        // 檢查 process.exit(1) 和 console.error 是否在 catch 區塊內
        const catchBlockStart = cliSourceCode.indexOf("} catch (error) {");
        const catchBlockEnd = cliSourceCode.lastIndexOf("}");

        if (catchBlockStart !== -1 && catchBlockEnd !== -1) {
          const catchBlock = cliSourceCode.substring(
            catchBlockStart,
            catchBlockEnd
          );

          // 檢查 process.exit(1) 在 catch 區塊內
          expect(catchBlock).to.include("process.exit(1)");

          // 檢查 console.error(error) 在 catch 區塊內
          expect(catchBlock).to.include("console.error(error)");
        } else {
          throw new Error("無法找到 catch 區塊");
        }
      });
    });
  });

  // ===== 加分項目 =====

  describe("批次處理能力（+10 分）", () => {
    it("支援處理多筆聚餐分帳資料", async () => {
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputDir}`,
        `--output=${outputDir}`,
      ];

      // Mock the splitBill function
      const mockOutput = {
        date: "2024年3月21日",
        location: "測試餐廳",
        subTotal: 100,
        tip: 10,
        totalAmount: 110,
        items: [{ name: "Alice", amount: 55 }],
      };
      const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

      try {
        // Clean up output directory
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
        fs.mkdirSync(outputDir, { recursive: true });

        await main(testArgs);

        // Verify multiple output files were created
        const outputFiles = fs.readdirSync(outputDir);
        expect(outputFiles.length).to.be.greaterThan(1);
        expect(outputFiles.some((f) => f.includes("bill-1"))).to.be.true;
        expect(outputFiles.some((f) => f.includes("bill-2"))).to.be.true;
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
      }
    });

    it("支援輸入目錄", async () => {
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputDir}`,
        `--output=${outputDir}`,
      ];

      const splitBillStub = sinon
        .stub(core, "splitBill")
        .returns({} as BillOutput);

      try {
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
        fs.mkdirSync(outputDir, { recursive: true });

        await main(testArgs);

        expect(fs.existsSync(outputDir)).to.be.true;
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
      }
    });

    it("支援輸出目錄", async () => {
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${outputDir}`,
      ];

      const mockOutput = {
        date: "2024年3月21日",
        location: "測試餐廳",
        subTotal: 100,
        tip: 10,
        totalAmount: 110,
        items: [{ name: "Alice", amount: 55 }],
      };
      const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

      try {
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
        fs.mkdirSync(outputDir, { recursive: true });

        await main(testArgs);

        // Verify output directory was created with files
        expect(fs.existsSync(outputDir)).to.be.true;
        const files = fs.readdirSync(outputDir);
        expect(files.length).to.be.greaterThan(0);
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
      }
    });

    it("自動掃描目錄中的所有 JSON 檔案", async () => {
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputDir}`,
        `--output=${outputDir}`,
      ];

      const mockOutput = {
        date: "2024年3月21日",
        location: "測試餐廳",
        subTotal: 100,
        tip: 10,
        totalAmount: 110,
        items: [{ name: "Alice", amount: 55 }],
      };
      const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

      try {
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
        fs.mkdirSync(outputDir, { recursive: true });

        await main(testArgs);

        // Check that all 3 JSON files were processed
        const outputFiles = fs.readdirSync(outputDir);
        const jsonFiles = outputFiles.filter((f) => f.endsWith(".json"));
        expect(jsonFiles.length).to.be.at.least(3);
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
      }
    });

    it("跳過非 JSON 檔案", async () => {
      const testDir = "sample-data/test-dir";
      const testOutputDir = "sample-data/test-output-dir";

      try {
        // Create test directory with JSON and non-JSON files
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true, force: true });
        }
        fs.mkdirSync(testDir, { recursive: true });

        // Create a JSON file
        fs.writeFileSync(
          path.join(testDir, "test.json"),
          JSON.stringify({
            date: "2024-03-21",
            location: "測試",
            tipPercentage: 10,
            items: [],
          })
        );

        // Create a non-JSON file
        fs.writeFileSync(path.join(testDir, "test.txt"), "not a JSON file");

        const testArgs = [
          "ts-node",
          "src/cli.ts",
          `--input=${testDir}`,
          `--output=${testOutputDir}`,
        ];

        const mockOutput = {
          date: "2024年3月21日",
          location: "測試",
          subTotal: 100,
          tip: 10,
          totalAmount: 110,
          items: [],
        };
        const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

        if (fs.existsSync(testOutputDir)) {
          fs.rmSync(testOutputDir, { recursive: true, force: true });
        }

        await main(testArgs);

        // Verify only JSON files were processed
        const outputFiles = fs.readdirSync(testOutputDir);
        expect(outputFiles).to.include("test.json");
        expect(outputFiles).to.not.include("test.txt");

        splitBillStub.restore();
      } finally {
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true, force: true });
        }
        if (fs.existsSync(testOutputDir)) {
          fs.rmSync(testOutputDir, { recursive: true, force: true });
        }
      }
    });
  });

  describe("非同步檔案處理（+5 分）", () => {
    it("使用 async/await 處理檔案 I/O 操作", async () => {
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${outputFile}`,
      ];

      const splitBillStub = sinon
        .stub(core, "splitBill")
        .returns({} as BillOutput);

      try {
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }

        // Main function should be async and not throw errors
        await main(testArgs);

        expect(fs.existsSync(outputFile)).to.be.true;
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      }
    });

    it("使用 Promise-based fs API", () => {
      const processorCode = fs.readFileSync("src/processor.ts", "utf-8");
      expect(processorCode).to.include("fs/promises");
      expect(processorCode).to.include("fsPromises.readFile");
      expect(processorCode).to.include("fsPromises.writeFile");
    });

    it("正確處理非同步檔案操作", async () => {
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputDir}`,
        `--output=${outputDir}`,
      ];

      const mockOutput = {
        date: "2024年3月21日",
        location: "測試餐廳",
        subTotal: 100,
        tip: 10,
        totalAmount: 110,
        items: [{ name: "Alice", amount: 55 }],
      };
      const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

      try {
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
        fs.mkdirSync(outputDir, { recursive: true });

        // Should complete without errors
        await main(testArgs);

        // Verify all files were written
        const files = fs.readdirSync(outputDir);
        expect(files.length).to.be.at.least(3);
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(outputDir)) {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
      }
    });

    it("保持非同步操作的功能性", async () => {
      // Test that the main function returns a Promise
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${outputFile}`,
      ];

      const result = main(testArgs);
      expect(result).to.be.instanceOf(Promise);

      const splitBillStub = sinon
        .stub(core, "splitBill")
        .returns({} as BillOutput);

      try {
        await result;
        expect(fs.existsSync(outputFile)).to.be.true;
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      }
    });
  });

  describe("文字格式輸出（+3 分）", () => {
    it("支援 --format 參數", async () => {
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${outputFile}`,
        "--format=text",
      ];

      const mockOutput = {
        date: "2024年3月21日",
        location: "測試餐廳",
        subTotal: 100,
        tip: 10,
        totalAmount: 110,
        items: [{ name: "Alice", amount: 55 }],
      };
      const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

      try {
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }

        await main(testArgs);

        // Should not throw error
        expect(fs.existsSync(outputFile)).to.be.true;
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      }
    });

    it("支援 json 格式輸出", async () => {
      const testOutputFile = "test-json-output.json";
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${testOutputFile}`,
        "--format=json",
      ];

      const mockOutput = {
        date: "2024年3月21日",
        location: "測試餐廳",
        subTotal: 100,
        tip: 10,
        totalAmount: 110,
        items: [{ name: "Alice", amount: 55 }],
      };
      const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

      try {
        if (fs.existsSync(testOutputFile)) {
          fs.unlinkSync(testOutputFile);
        }

        await main(testArgs);

        const content = fs.readFileSync(testOutputFile, "utf-8");
        expect(content).to.include('"date"');
        expect(content).to.include('"location"');
        JSON.parse(content); // Should be valid JSON
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(testOutputFile)) {
          fs.unlinkSync(testOutputFile);
        }
      }
    });

    it("支援 text 格式輸出", async () => {
      const testOutputFile = "test-text-output.txt";
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${testOutputFile}`,
        "--format=text",
      ];

      const mockOutput = {
        date: "2024年3月21日",
        location: "測試餐廳",
        subTotal: 100,
        tip: 10,
        totalAmount: 110,
        items: [{ name: "Alice", amount: 55 }],
      };
      const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

      try {
        if (fs.existsSync(testOutputFile)) {
          fs.unlinkSync(testOutputFile);
        }

        await main(testArgs);

        const content = fs.readFileSync(testOutputFile, "utf-8");
        expect(content).to.include("測試餐廳");
        expect(content).to.include("小計:");
        expect(content).to.include("小費:");
        expect(content).to.include("共計:");
        expect(content).to.include("個人應付:");
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(testOutputFile)) {
          fs.unlinkSync(testOutputFile);
        }
      }
    });

    it("輸出格式化的文字報告", async () => {
      const testOutputFile = "test-formatted-output.txt";
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${testOutputFile}`,
        "--format=text",
      ];

      const mockOutput = {
        date: "2024年3月21日",
        location: "測試餐廳",
        subTotal: 100,
        tip: 10,
        totalAmount: 110,
        items: [
          { name: "Alice", amount: 55 },
          { name: "Bob", amount: 55 },
        ],
      };
      const splitBillStub = sinon.stub(core, "splitBill").returns(mockOutput);

      try {
        if (fs.existsSync(testOutputFile)) {
          fs.unlinkSync(testOutputFile);
        }

        await main(testArgs);

        const content = fs.readFileSync(testOutputFile, "utf-8");
        const lines = content.split("\n");
        expect(lines.length).to.be.greaterThan(3);
        expect(content).to.include("Alice");
        expect(content).to.include("Bob");
      } finally {
        splitBillStub.restore();
        if (fs.existsSync(testOutputFile)) {
          fs.unlinkSync(testOutputFile);
        }
      }
    });

    it("處理無效的格式參數", async () => {
      const testArgs = [
        "ts-node",
        "src/cli.ts",
        `--input=${inputFile}`,
        `--output=${outputFile}`,
        "--format=invalid",
      ];

      // Mock process.exit to prevent actual exit
      const originalExit = process.exit;
      let exitCalled = false;
      let exitCode = 0;

      (process as any).exit = (code: number) => {
        exitCalled = true;
        exitCode = code;
      };

      try {
        await main(testArgs);

        // Should have called process.exit(1) due to error
        expect(exitCalled).to.be.true;
        expect(exitCode).to.equal(1);
      } finally {
        process.exit = originalExit;
      }
    });
  });
});
