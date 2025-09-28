//input

type BillInput = {
  date: string;
  location: string;
  tipPercentage: number;
  items: BillItem[];
};

type BillItem = SharedBillItem | PersonalBillItem;

type CommonBillItem = {
  price: number;
  name: string;
};

type SharedBillItem = CommonBillItem & {
  isShared: true;
};

type PersonalBillItem = CommonBillItem & {
  isShared: false;
  person: string;
};

//output

type BillOutput = {
  date: string;
  location: string;
  subTotal: number;
  tip: number;
  totalAmount: number;
  items: PersonItem[];
};

type PersonItem = {
  name: string;
  amount: number;
};

// 核心函數

function splitBill(input: BillInput): BillOutput {
  let date = formatDate(input.date);
  let location = input.location;
  let subTotal = calculateSubTotal(input.items);
  let tip = calculateTip(subTotal, input.tipPercentage);
  let totalAmount = subTotal + tip;
  // splitBill 函数内部
  let items = calculateItems(input.items, input.tipPercentage);
  adjustAmount(totalAmount, items);
  return {
    date,
    location,
    subTotal,
    tip,
    totalAmount,
    items,
  };
}

function formatDate(date: string): string {
  // input format: YYYY-MM-DD, e.g. "2024-03-21"
  // output format: YYYY年M月D日, e.g. "2024年3月21日"
  let Year: number = +date.split("-")[0];
  let Month: number = +date.split("-")[1];
  let Day: number = +date.split("-")[2];
  return `${Year}年${Month}月${Day}日`;
}

function calculateSubTotal(items: BillItem[]): number {
  // sum up all the price of the items
  return items.reduce((sum, item) => sum + item.price, 0);
}

function calculateTip(subTotal: number, tipPercentage: number): number {
  // output round to closest 10 cents, e.g. 12.34 -> 12.3
  const tipAmount = (subTotal * tipPercentage) / 100;
  return Math.round(tipAmount * 10) / 10;
}

function scanPersons(items: BillItem[]): string[] {
  // scan the persons in the items
  const persons = new Set<string>();
  items.forEach((item) => {
    if (!item.isShared) {
      persons.add(item.person);
    }
  });
  return Array.from(persons);
}

function calculateItems(
  items: BillItem[],
  tipPercentage: number
): PersonItem[] {
  let names = scanPersons(items);
  let persons = names.length;
  return names.map((name) => ({
    name,
    amount: calculatePersonAmount({
      items,
      tipPercentage,
      name,
      persons,
    }),
  }));
}

function calculatePersonAmount(input: {
  items: BillItem[];
  tipPercentage: number;
  name: string;
  persons: number;
}): number {
  // for shared items, split the price evenly
  // for personal items, do not split the price
  // return the amount for the person
  let amount = 0;
  input.items.forEach((item) => {
    if (item.isShared) {
      amount += item.price / input.persons;
    } else if (item.person === input.name) {
      amount += item.price;
    }
  });
  // add tip
  amount += (amount * input.tipPercentage) / 100;
  // round to closest 10 cents
  return Math.round(amount * 10) / 10;
}

function adjustAmount(totalAmount: number, items: PersonItem[]): void {
  // adjust the personal amount to match the total amount
  let sum = items.reduce((acc, item) => acc + item.amount, 0);
  let difference = Math.round((totalAmount - sum) * 10) / 10;
  if (difference !== 0) {
    items[0].amount = Math.round((items[0].amount + difference) * 10) / 10;
  }
  items.forEach((item) => {
    item.amount = Math.round(item.amount * 10) / 10;
  });
  // 重新計算總金額
  sum = items.reduce((acc, item) => acc + item.amount, 0);
  if (Math.round(sum * 10) / 10 !== totalAmount) {
    throw new Error("計算錯誤，請檢查輸入的帳單項目");
  }
}
