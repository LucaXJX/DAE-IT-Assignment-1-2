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
  let items = calculateItems({
    items: input.items,
    tipPercentage: input.tipPercentage,
  });
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
}

function scanPersons(items: BillItem[]): string[] {
  // scan the persons in the items
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
}

function adjustAmount(totalAmount: number, items: PersonItem[]): void {
  // adjust the personal amount to match the total amount
}
