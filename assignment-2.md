程式編寫基礎

# 習作二：聚餐分帳擴展與檔案處理 (Bill Splitting Extension with File I/O)

此習作佔本科目總分的 **15%**。

**提交日期：2025-10-19**

## 習作簡介

本習作讓學生基於 _習作一：聚餐分帳計算核心 (Computation Core)_ 的基礎上，擴展核心功能並實作檔案處理能力，讓程式能夠讀取 JSON 檔案中的用餐資訊，處理多筆帳單，並輸出格式化的分帳結果到檔案。

## 習作要求

### 核心功能

- **檔案 I/O 處理**：從 JSON 檔案讀取聚餐分帳資料，驗證格式正確性，輸出 JSON 格式結果
- **命令列介面**：支援 `--input`、`--output` 參數，使用 Node.js 內建的 `process.argv`
- **錯誤處理**：處理檔案不存在、JSON 格式錯誤等異常情況
- **模組化設計**：重用習作一的計算函數，使用 TypeScript 開發
- **版本控制**：使用 Git 進行版本控制，適當的提交訊息和提交歷史

### 加分項目（進階功能）

- **批次處理能力**（+10 分）：支援處理多筆聚餐分帳資料，支援輸入/輸出目錄，自動掃描目錄中的所有 JSON 檔案，跳過非 JSON 檔案。
- **非同步檔案處理**（+5 分）：使用 `async/await` 處理檔案 I/O 操作。 (使用 Promise-based fs API)
- **文字格式輸出**（+3 分）：支援 `--format` 參數控制輸出格式（json 或 text），支援輸出格式化的文字報告。

---

## 建議使用工具與程式庫

- **開發工具**

  - Git Graph（視覺化 Git 提交歷史）
  - Prettier（格式化程式碼）
  - Error Lens（顯示語法錯誤詳細資訊）
  - Auto Import（自動載入程式庫）
  - Todo Tree（顯示 TODO 註解）

- **Node.js 內建模組**

  - `fs`（檔案系統操作）
  - `path`（檔案路徑處理）
  - `process.argv`（命令列參數）

- **人工智能對話機器人**
  - Poe（提供程式設計諮詢）
  - Perplexity（根據網路資訊提供程式設計諮詢）

---

## 程式運行流程

### **命令列執行**

程式透過命令列參數執行，支援以下格式：

```bash
# 基本用法 - 處理單一檔案
npx ts-node src/cli.ts --input=bill.json --output=result.json

# 指定輸出格式
npx ts-node src/cli.ts --input=bill.json --output=result.txt --format=text

# 批次處理（加分項目）- 處理目錄中的所有檔案
npx ts-node src/cli.ts --input=input-dir/ --output=output-dir/ --format=json
```

### **輸入檔案格式**

#### **單一帳單格式（基本要求）**

輸入檔案應為 JSON 格式，包含一筆聚餐分帳資料：

```json
{
  "date": "2024-03-21",
  "location": "開心小館",
  "tipPercentage": 10,
  "items": [
    {
      "name": "牛排",
      "price": 199,
      "isShared": true
    },
    {
      "name": "橙汁",
      "price": 10,
      "isShared": false,
      "person": "Alice"
    },
    {
      "name": "薯條",
      "price": 12,
      "isShared": true
    },
    {
      "name": "熱檸檬水",
      "price": 8,
      "isShared": false,
      "person": "Bob"
    },
    {
      "name": "熱檸檬水",
      "price": 8,
      "isShared": false,
      "person": "Charlie"
    }
  ]
}
```

#### **批次處理說明（加分項目）**

對於批次處理，程式會掃描輸入目錄中的所有 JSON 檔案，每個檔案都使用與單一檔案相同的格式。程式會自動跳過非 JSON 檔案（如 `.DS_Store`、`.txt` 等），只處理 `.json` 副檔名的檔案。例如：

**輸入目錄結構：**

```
input-dir/
├── bill-1.json       ← 會被處理
├── bill-2.json       ← 會被處理
├── bill-3.json       ← 會被處理
├── .DS_Store         ← 會被跳過
└── readme.txt        ← 會被跳過
```

**每個 JSON 檔案格式（與單一檔案相同）：**

`bill-1.json`:

```json
{
  "date": "2024-03-21",
  "location": "開心小館",
  "tipPercentage": 10,
  "items": [
    {
      "name": "牛排",
      "price": 199,
      "isShared": true
    },
    {
      "name": "橙汁",
      "price": 10,
      "isShared": false,
      "person": "Alice"
    },
    {
      "name": "薯條",
      "price": 12,
      "isShared": true
    },
    {
      "name": "熱檸檬水",
      "price": 8,
      "isShared": false,
      "person": "Bob"
    },
    {
      "name": "熱檸檬水",
      "price": 8,
      "isShared": false,
      "person": "Charlie"
    }
  ]
}
```

`bill2.json`:

```json
{
  "date": "2024-03-22",
  "location": "美味餐廳",
  "tipPercentage": 10,
  "items": [
    {
      "name": "義大利麵",
      "price": 120,
      "isShared": false,
      "person": "Charlie"
    }
  ]
}
```

### **輸出檔案格式**

#### **JSON 格式輸出**

**單一帳單輸出（基本要求）**：

```json
{
  "date": "2024年3月21日",
  "location": "開心小館",
  "subTotal": 237,
  "tip": 23.7,
  "totalAmount": 260.7,
  "items": [
    {
      "name": "Alice",
      "amount": 88.3
    },
    {
      "name": "Bob",
      "amount": 86.2
    },
    {
      "name": "Charlie",
      "amount": 86.2
    }
  ]
}
```

**批次處理輸出（加分項目）**：

批次處理會為每個輸入檔案產生對應的輸出檔案，輸出檔案名稱遵循輸入檔案名稱加上 `-result` 後綴。

**輸出目錄結構：**

```
output-dir/
├── bill-1-result.json    ← 對應 bill-1.json
├── bill-2-result.json    ← 對應 bill-2.json
└── bill-3-result.json    ← 對應 bill-3.json
```

每個輸出檔案的格式與單一檔案輸出完全相同。

#### **文字格式輸出（加分項目）**

```
===== 聚餐分帳結果 =====
日期：2024年3月21日
地點：開心小館

均分項目：
1. 牛排 ($199.0)
2. 薯條 ($12.0)

非均分項目 - Alice：
1. 橙汁 ($10.0)

非均分項目 - Bob：
1. 熱檸檬水 ($8.0)

非均分項目 - Charlie：
1. 熱檸檬水 ($8.0)

小結：$237.0

小費：$23.7

總金額：$260.7

分帳結果：
1. Alice 應付：$88.3
2. Bob 應付：$86.2
3. Charlie 應付：$86.2
```

---

## 評分標準

### **評分標準概要**

| 項目                   | 分數  |
| ---------------------- | ----- |
| **功能擴展與核心邏輯** | 40 分 |
| **檔案 I/O 處理**      | 30 分 |
| **錯誤處理與程式品質** | 20 分 |
| **程式碼架構與可讀性** | 7 分  |
| **版本控制**           | 3 分  |

總分：100 分（佔本科目總分 15%）

### **具體評分標準**

#### **功能擴展與核心邏輯（40 分）**

- 重用習作一計算函數（15 分）
  - 正確調用習作一的核心計算邏輯
  - 保持計算結果的一致性
- 單一檔案處理能力（15 分）
  - 支援處理單筆聚餐分帳資料
  - 正確讀取和解析 JSON 輸入格式
  - 正確輸出計算結果
- 命令列參數解析（10 分）
  - 支援 `--input` 和 `--output` 參數
  - 正確解析命令列參數

#### **檔案 I/O 處理（30 分）**

- JSON 檔案讀取（10 分）
  - 正確讀取和解析 JSON 檔案
  - 處理檔案路徑和權限問題
- 檔案寫入（10 分）
  - 正確寫入輸出檔案
  - 支援 JSON 格式的檔案輸出
- 檔案格式驗證（10 分）
  - 驗證輸入 JSON 格式的正確性
  - 處理格式錯誤的優雅降級

#### **錯誤處理與程式品質（20 分）**

- 檔案錯誤處理（8 分）
  - 處理檔案不存在的情況
  - 處理檔案讀寫權限問題
- JSON 錯誤處理（7 分）
  - 處理 JSON 格式錯誤
  - 提供有意義的錯誤訊息
- 程式穩定性（5 分）
  - 程式不會因為輸入錯誤而崩潰
  - 提供適當的錯誤訊息和退出碼

#### **程式碼架構與可讀性（7 分）**

- 模組化設計（4 分）
  - 適當的函數分離和重用
  - 清晰的程式碼結構
- 程式碼品質（3 分）
  - 適當的註解和變數命名
  - 程式碼格式化和一致性

#### **版本控制（3 分）**

- Git 使用（3 分）
  - 使用 Git 進行版本控制
  - 適當的提交訊息和提交歷史

### **加分項目**

- **批次處理能力**（+10 分）：支援處理多筆聚餐分帳資料，支援輸入/輸出目錄，自動掃描目錄中的所有 JSON 檔案，跳過非 JSON 檔案
- **非同步檔案處理**（+5 分）：使用 `async/await` 處理檔案 I/O (使用 Promise-based fs API)
- **文字格式輸出**（+3 分）：支援 `--format` 參數控制輸出格式（json 或 text），支援輸出格式化的文字報告

**注意：加分項目不累積計算，取最高分數的一項加分。**

---

## 提供的習作項目

1. **下載 ZIP 壓縮包**，包含：

- `package.json` (包括 `dependencies`, `devDependencies`, `scripts`)
- `tsconfig.json` (包括 `compilerOptions`)
- `src/` （程式源碼）
  - `core.ts` (習作一的核心計算邏輯)
  - `processor.ts` (檔案處理主程式)
  - `types.ts` (型別定義)
- `sample-data/` (範例資料檔案)
  - `single-bill.json` (單筆帳單範例)
  - `input-dir/` (批次處理輸入目錄，包含多個 JSON 檔案)
  - `output-dir/` (批次處理輸出目錄)
- `README.md`（簡略使用說明）

2. **安裝程式庫**：

```bash
npm install
```

3. **實現程式**

4. **執行程式**：

```bash
# 基本用法 - 處理單一帳單
npx ts-node src/cli.ts --input=sample-data/single-bill.json --output=result.json

# 指定輸出格式為文字
npx ts-node src/cli.ts --input=sample-data/single-bill.json --output=result.txt --format=text

# 批次處理（加分項目）- 處理目錄中的所有檔案
npx ts-node src/cli.ts --input=sample-data/input-dir/ --output=sample-data/output-dir/ --format=json
```

---

## 提交格式

1. **程式碼應使用 Git 進行版本控制**，並推送至 **GitHub**。
2. **提交 ZIP 壓縮包**，包含：
   - `.git/` (包括 git commit 紀錄)
   - `package.json` (包括 `dependencies`, `devDependencies`, `scripts`)
   - `tsconfig.json` (包括 `compilerOptions`)
   - `src/` （程式源碼）
   - `sample-data/` （範例資料檔案）
   - `README.md`（包含學生名稱及簡略使用說明）
3. **不要包括**：
   - `node_modules/` (下載的依賴項)
   - `package-lock.json` (解析的依賴項)
   - `dist/` (編譯輸出)
4. **請確保程式可運行，無編譯錯誤或缺少依賴項等。**

---

## 學習進階建議

完成本習作後，建議學生探索以下進階概念：

- **資料庫整合**：將分帳結果儲存到資料庫中
- **Web API 開發**：建立 RESTful API 處理分帳請求
- **實時處理**：使用 WebSocket 實現即時分帳更新
- **資料視覺化**：使用圖表顯示分帳統計資訊
- **行動應用**：開發手機應用程式進行分帳管理
