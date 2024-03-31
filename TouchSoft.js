// What about LinkedList?
//  it sucks in case with 10_000_000 calls
//  execute time more then 10.000 ms
// so I did regular example and a bit faster variation

// ex 1 regular
(() => {
  class Consumer {
    _elements = [];
    static TIME_SPAN = 1000 * 60 * 5; // 5 min

    /**
     * Called periodically to consume an integer.
     */
    accept(number) {
      if (number && typeof number === "number") {
        const date = +new Date();
        const data = { number, date };
        this._elements.push(data);

        return true;
      }

      return false;
    }

    /**
     * Returns the mean (aka average) of numbers consumed in the
     * last 5 minute period.
     */
    mean() {
      const currentDate = +new Date();
      const periodNumbers = this._elements
        .filter((el) => currentDate - el.date <= Consumer.TIME_SPAN)
        .map((el) => el.number);
      const result =
        periodNumbers.reduce((acc, number) => acc + number, 0) /
        periodNumbers.length;

      return result ? result : 0;
    }
  }

  const consumer = new Consumer();

  consumer.accept(1);
  consumer.accept(2);
  consumer.accept(3);
  console.log(consumer.mean());

  setTimeout(() => {
    consumer.accept(4);
    consumer.accept(5);
    consumer.accept(6);
    console.log(consumer.mean());
  }, Consumer.TIME_SPAN + 100);

  const MAX = 10_000_000;
  console.time("regular");
  for (let i = 0; i < MAX; i++) {
    consumer.accept(i);
  }
  console.timeEnd("regular"); /* ~1000-1700 ms on my PC
  first execute always 1500+ ms */
})();

// ex 2 high performance
// You need to comment example 1 to see difference in performance (cas of GC)
(() => {
  class IntArray {
    _array;
    _currentIndex = 0;

    constructor(capacity = 10) {
      this._array = new Int32Array(capacity);
    }

    _expandArray() {
      const newArrayLength = this._array.length * 2;
      const newArray = new Int32Array(newArrayLength);

      for (let i = 0; i < this._array.length; i++) {
        newArray[i] = this._array[i];
      }

      this._array = newArray;
    }

    push(number) {
      if (number > 2_147_483_647 || number < -2_147_483_648)
        throw new Error("Passing number must have Int32 type");

      if (this._array.length === this._currentIndex) {
        this._expandArray();
      }
      this._array[this._currentIndex] = number;
      this._currentIndex++;

      return true;
    }

    get(index) {
      if (index > this._currentIndex) return false;

      return this._array[index];
    }

    length() {
      return this._currentIndex;
    }

    getAll() {
      const arrayToReturn = new Int32Array(this._currentIndex);

      for (let i = 0; i < arrayToReturn.length; i++) {
        arrayToReturn[i] = this._array[i];
      }

      return arrayToReturn;
    }
  }

  class Consumer {
    _numbers = new IntArray();
    _dates = new IntArray();
    _INITIAL_DATE = +new Date();
    static TIME_SPAN = 1000 * 60 * 5; // 5 min

    constructor() {
      setInterval(() => {
        this._clean();
      }, Math.floor(Consumer.TIME_SPAN / 2));
    }

    // removes all expired numbers (and dates) in order
    // to prevent high memory consuming
    _clean() {
      const desiredStartIndex = this._getDesiredStartIndex();
      const newLength = this._numbers.length() - desiredStartIndex;

      const numbers = new IntArray(newLength);
      const dates = new IntArray(newLength);

      for (let i = 0; i < newLength; i++) {
        const oldIndex = i + desiredStartIndex;
        numbers[i] = this._numbers[oldIndex];
        dates[i] = this._numbers[oldIndex];
      }

      this._numbers = numbers;
      this._dates = dates;
    }

    /**
     * Called periodically to consume an integer.
     */
    accept(number) {
      if (number && typeof number === "number") {
        const date = +new Date() - this._INITIAL_DATE;
        this._dates.push(date);
        this._numbers.push(number);

        return true;
      }

      return false;
    }

    _getDesiredStartIndex() {
      const currentDate = +new Date();
      const length = this._dates.length();
      let desiredStartIndex = -1;

      for (let i = 0; i < length; i++) {
        const date = this._dates.get(i) + this._INITIAL_DATE;

        if (currentDate - date <= Consumer.TIME_SPAN) {
          desiredStartIndex = i;
          break;
        }
      }

      return desiredStartIndex;
    }

    _getAvgFromIndex(index) {
      const length = this._numbers.length();
      let sum = 0;

      for (let i = index; i < length; i++) {
        sum += this._numbers.get(i);
      }

      const avg = sum / (length - index);

      return avg;
    }

    /**
     * Returns the mean (aka average) of numbers consumed in the
     * last 5 minute period.
     */
    mean() {
      const desiredStartIndex = this._getDesiredStartIndex();

      // Idk what I should return in case if no numbers in 5m split
      // I decided to return 0, but it could be false or null as well
      if (desiredStartIndex === -1) return 0;

      return this._getAvgFromIndex(desiredStartIndex);
    }
  }

  const consumer = new Consumer();

  consumer.accept(1);
  consumer.accept(2);
  consumer.accept(3);
  console.log(consumer.mean());

  setTimeout(() => {
    consumer.accept(4);
    consumer.accept(5);
    consumer.accept(6);
    console.log(consumer.mean());
  }, Consumer.TIME_SPAN + 100);

  const MAX = 10_000_000;
  console.time("performance");
  for (let i = 0; i < MAX; i++) {
    consumer.accept(i);
  }
  console.timeEnd("performance"); /* always ~900 ms on my PC */
})();
