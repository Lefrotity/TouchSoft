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

// ex 1
consumer.accept(1);
consumer.accept(true);
if (consumer.accept("Hello world")) {
  console.log("Added");
} else {
  console.error("failure, try to check data type, must be a number");
}
consumer.accept(2);
consumer.accept(3);
console.log(consumer.mean()); // 2

// ex 2
setTimeout(() => {
  consumer.accept(10);
  consumer.accept(12);
  consumer.accept(14);
  console.log(consumer.mean());
}, 100); // 7

// ex 3
setTimeout(() => {
  consumer.accept(10);
  consumer.accept(12);
  consumer.accept(14);
  console.log(consumer.mean());
}, Consumer.TIME_SPAN + 100); // 12

/* 
    Some thoughts
    1. Array or List 
        Array is OK cas push() is O(1), but if we were for example 
        in C++ it would be O(n). In C++ we have to create a new array
        when adding a number.
    2. Cleaner
        I could declare a method clean() which calls (initially in 
        constructor in setInterval) for example every 
        minute and removes all expired elements in order to reduce 
        memory consuming. But Idk if this necessary in such task
    3. More performance
        I also could write mean() using standard for (;;) in order
        to make all desired actions in one iteration. But this method 
        doesn't look like it needs absolute performance
*/
