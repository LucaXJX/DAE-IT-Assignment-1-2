程式編寫基礎

# 習作一：聚餐分帳計算核心 (Computation Core)

此習作佔本科目總分的 **15%**。

**提交日期：2025-02-15**

## 習作簡介

本習作的目標是讓學生實作*聚餐分帳計算器*的**核心運算邏輯**，不涉及 CLI 或 GUI 介面。學生將專注於資料結構、計算邏輯、函數設計，並使用單元測試來確保正確性。

### 學習目標

- 熟悉 **Javascript** 的 **資料型態**（如物件、字串、陣列及其方法）。
- 熟悉 **TypeScript** 的 **類型語法** 及 **應用**。
- 使用 **函數式設計** 來實現計算邏輯。
- 透過 **單元測試** (Unit Test) 確保程式正確運作。
- 理解 **數值計算的四捨五入與誤差調整**。

---

## 習作要求

### 核心函數運算邏輯

1. **傳入用餐資訊**

- 日期
- 地點
- 小費百分比

2. **傳入收費項目**

- 餐點名稱
- 餐點價格
- 是否均分
- 如非均分，則包括人名

3. **計算總金額**

- 包含所有餐點的總價格。

4. **計算小費**

- 按百分比計算小費並加總至總金額。

5. **計算個人應付金額**

- 四捨五入至最近 $0.1 元。

6. **誤差調整**

- 若四捨五入後的總金額與實際總金額有誤差，需進行 ±0.1 的調整，確保總額一致。

7. **傳出結果**

- 輸出格式化的用餐資訊。
- 輸出所有餐點的總金額、小費、個人應付金額。

### 技術要求

- **使用 TypeScript** 開發。
- **實現函數** 處理傳入參數和傳入結果，不需實現 CLI 和 GUI。
- **需經過單元測試**（不可修改指定的單元測試）。

---

## 運算範例

### 輸入

```typescript
type BillInput = {
  date: string
  location: string
  tipPercentage: number
  items: BillItem[]
}

type BillItem = SharedBillItem | PersonalBillItem

type CommonBillItem = {
  price: number
  name: string
}

type SharedBillItem = CommonBillItem & {
  isShared: true
}

type PersonalBillItem = CommonBillItem & {
  isShared: false
  person: string
}
```

### 輸出

```typescript
type BillOutput = {
  date: string
  location: string
  subTotal: number
  tip: number
  totalAmount: number
  items: PersonItem[]
}

type PersonItem = {
  name: string
  amount: number
}
```

### 核心函數

```typescript
function splitBill(input: BillInput): BillOutput {
  let date = formatDate(input.date)
  let location = input.location
  let subTotal = calculateSubTotal(input.items)
  let tip = calculateTip(subTotal, input.tipPercentage)
  let totalAmount = subTotal + tip
  let items = calculateItems({
    items: input.items,
    tipPercentage: input.tipPercentage,
  })
  adjustAmount(totalAmount, items)
  return {
    date,
    location,
    subTotal,
    tip,
    totalAmount,
    items,
  }
}

function formatDate(date: string): string {
  // input format: YYYY-MM-DD, e.g. "2024-03-21"
  // output format: YYYY年M月D日, e.g. "2024年3月21日"
}

function calculateSubTotal(items: BillItem[]): number {
  // sum up all the price of the items
}

function calculateTip(subTotal: number, tipPercentage: number): number {
  // output round to closest 10 cents, e.g. 12.34 -> 12.3
}

function scanPersons(items: BillItem[]): string[] {
  // scan the persons in the items
}

function calculateItems(
  items: BillItem[],
  tipPercentage: number,
): PersonItem[] {
  let names = scanPersons(items)
  let persons = names.length
  return names.map(name => ({
    name,
    amount: calculatePersonAmount({
      items,
      tipPercentage,
      name,
      persons,
    }),
  }))
}

function calculatePersonAmount(input: {
  items: BillItem[]
  tipPercentage: number
  name: string
  persons: number
}): number {
  // for shared items, split the price evenly
  // for personal items, do not split the price
  // return the amount for the person
}

function adjustAmount(totalAmount: number, items: PersonItem[]): void {
  // adjust the personal amount to match the total amount
}
```

### 運算範例 - 日期格式

#### 測試案例 1：2-digit month and day

```typescript
let input = '2024-12-21'
let output = '2024年12月21日'
```

#### 測試案例 2：1-digit month

```typescript
let input = '2024-01-21'
let output = '2024年1月21日'
```

#### 測試案例 3：1-digit day

```typescript
let input = '2024-12-01'
let output = '2024年12月1日'
```

### 運算範例 - 小費計算

#### 測試案例 1：無小費

```typescript
let subTotal = 100
let tipPercentage = 0
let output = 0
```

#### 測試案例 2：有小費，不需要四捨五入

```typescript
let subTotal = 100
let tipPercentage = 10
let output = 10
```

#### 測試案例 3：有小費，向下四捨五入

```typescript
let subTotal = 123.4
let tipPercentage = 10
let output = 12.3
```

#### 測試案例 4：有小費，向上四捨五入

```typescript
let subTotal = 123.5
let tipPercentage = 10
let output = 12.4
```

### 運算範例 - 分帳計算

#### 測試案例 1：無舍入誤差

```typescript
const input = {
  date: '2024-03-21',
  location: '開心小館',
  tipPercentage: 10,
  items: [
    {
      price: 82,
      name: '牛排',
      isShared: true,
    },
    {
      price: 10,
      name: '橙汁',
      isShared: false,
      person: 'Alice',
    },
    {
      price: 8,
      name: '熱檸檬水',
      isShared: false,
      person: 'Bob',
    },
  ],
}
const output = {
  date: '2024年3月21日',
  location: '開心小館',
  subTotal: 100,
  tip: 10,
  totalAmount: 110,
  items: [
    {
      name: 'Alice',
      amount: 56.1,
    },
    {
      name: 'Bob',
      amount: 53.9,
    },
  ],
}
```

#### 測試案例 2：有舍入誤差，向下調整 0.1 元

```typescript
const input = {
  date: '2024-03-21',
  location: '開心小館',
  tipPercentage: 10,
  items: [
    {
      price: 199,
      name: '牛排',
      isShared: true,
    },
    {
      price: 10,
      name: '橙汁',
      isShared: false,
      person: 'Alice',
    },
    {
      price: 12,
      name: '薯條',
      isShared: true,
    },
    {
      price: 8,
      name: '熱檸檬水',
      isShared: false,
      person: 'Bob',
    },
    {
      price: 8,
      name: '熱檸檬水',
      isShared: false,
      person: 'Charlie',
    },
  ],
}
const output = {
  date: '2024年3月21日',
  location: '開心小館',
  subTotal: 237,
  tip: 23.7,
  totalAmount: 260.7,
  items: [
    {
      name: 'Alice',
      amount: 88.3 /* 向下調整 0.1 元 */,
    },
    {
      name: 'Bob',
      amount: 86.2,
    },
    {
      name: 'Charlie',
      amount: 86.2,
    },
  ],
}
```

#### 測試案例 3：有舍入誤差，向上調整 0.1 元

```typescript
const input = {
  date: '2024-03-21',
  location: '開心小館',
  tipPercentage: 10,
  items: [
    {
      price: 194,
      name: '牛排',
      isShared: true,
    },
    {
      price: 10,
      name: '橙汁',
      isShared: false,
      person: 'Alice',
    },
    {
      price: 10,
      name: '橙汁',
      isShared: false,
      person: 'Bob',
    },
    {
      price: 10,
      name: '橙汁',
      isShared: false,
      person: 'Charlie',
    },
  ],
}
const output = {
  date: '2024年3月21日',
  location: '開心小館',
  subTotal: 224,
  tip: 22.4,
  totalAmount: 246.4,
  items: [
    {
      name: 'Alice',
      amount: 82.2 /* 向上調整 0.1 元 */,
    },
    {
      name: 'Bob',
      amount: 82.1,
    },
    {
      name: 'Charlie',
      amount: 82.1,
    },
  ],
}
```

---

## 建議使用工具與程式庫

- **開發工具**

  - Prettier（格式化程式碼）
  - Error Lens（顯示語法錯誤詳細資訊）
  - Todo Tree（顯示 TODO 註解）

- **人工智能對話機器人**

  - Poe（提供程式設計諮詢）
  - Perplexity（根據網路資訊提供程式設計諮詢）

---

## 測試案例分數

| 運算範例 | 測試案例                    | 通過得分 |
| -------- | --------------------------- | -------- |
| 日期格式 | 2-digit month and day       | 5 分     |
| 日期格式 | 1-digit month               | 5 分     |
| 日期格式 | 1-digit day                 | 5 分     |
|          |                             |          |
| 小費計算 | 無小費                      | 10 分    |
| 小費計算 | 有小費，不需要四捨五入      | 10 分    |
| 小費計算 | 有小費，向下四捨五入        | 10 分    |
| 小費計算 | 有小費，向上四捨五入        | 10 分    |
|          |                             |
| 分帳計算 | 無舍入誤差                  | 15 分    |
| 分帳計算 | 有舍入誤差，向下調整 0.1 元 | 15 分    |
| 分帳計算 | 有舍入誤差，向上調整 0.1 元 | 15 分    |

總分: 100 分

---

## 提供的習作項目

1. **下載 ZIP 壓縮包**，包含：

- `package.json` (包括 `dependencies`, `devDependencies`, `scripts`)
- `tsconfig.json` (包括 `compilerOptions`)
- `src/` （程式源碼）
- `README.md`（簡略使用說明）
- `test/` （包含測試輸入和輸出，不要改動）

2. **安裝程式庫**：

```bash
npm install
```

3. **實現函數**

4. **執行測試**：

```bash
npm test
```

---

## 提交格式

1. **程式碼應使用 Git 進行版本控制**，並推送至 **GitHub**。
2. **提交 ZIP 壓縮包**，包含：
   - `.git/` (包括 git commit 紀錄)
   - `package.json` (包括 `dependencies`, `devDependencies`, `scripts`)
   - `tsconfig.json` (包括 `compilerOptions`)
   - `src/` （程式源碼）
   - `README.md`（包含學生名稱及簡略使用說明）
   - `test/` （包含測試輸入和輸出，不要改動）
3. **不要包括**：
   - `node_modules/` (下載的依賴項)
   - `package-lock.json` (解析的依賴項)
   - `dist/` (編譯輸出)
4. **請確保程式可運行，無編譯錯誤或缺少依賴項等。**
