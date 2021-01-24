/*
尽可能还原 Promise 中的每一个 API, 并通过注释的方式描述思路和原理.
*/

const FULFILLED = 'fulfilled';
const REJECTED = 'REJECTED';
const PENDING = 'pending';

class MyPromise {
  // 状态
  status = PENDING;

  // 执行后返回值
  value = undefined;

  // 转型后失败原因
  reason = undefined;

  // 成功callback
  successCallback = [];

  // 失败callback
  failCallback = [];

  constructor(excutor) {
    // 执行器
    try {
      excutor(this.resolve, this.reject);
    } catch (err) {
      this.reject(err);
    }
  }

  resolve = (value) => {
    // 只有挂起状态才执行状态改变
    if (this.status !== PENDING) return;

    this.status = FULFILLED;

    this.value = value;
    // 异步后判断回调存在，存在则启用回调方法
    while (this.successCallback.length) {
      this.successCallback.shift()();
    }
  };

  reject = (reason) => {
    // 只有挂起状态才执行状态改变
    if (this.status !== PENDING) return;

    this.status = REJECTED;
    this.reason = reason;

    // 异步后判断回调存在，存在则启用回调方法
    while (this.failCallback.length) {
      this.failCallback.shift()();
    }
  };

  then = (successCallback, failCallback) => {
    // 无参传递
    successCallback = successCallback ? successCallback : (value) => value;

    failCallback = failCallback
      ? failCallback
      : (reason) => {
          throw reason;
        };

    const returnPromise = new MyPromise((resolve, reject) => {
      //   判断当前状态执行不同回调
      if (this.status === FULFILLED) {
        setTimeout(() => {
          // 使用异步，获取returnPromise
          try {
            const result = successCallback(this.value);

            resolvePromise(returnPromise, result, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      } else if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            reject(failCallback(this.reason));
          } catch (error) {
            reject(error);
          }
        }, 0);
      } else {
        // 挂起状态
        this.successCallback.push(() => {
          setTimeout(() => {
            // 使用异步，获取returnPromise
            try {
              const result = successCallback(this.value);

              resolvePromise(returnPromise, result, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
        this.failCallback.push(() => {
          setTimeout(() => {
            try {
              reject(failCallback(this.reason));
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
      }
    });
    return returnPromise;
  };

  finally = (fn) => {
    //   then函数调用，根据逻辑结果返回正确信息或者错误信息，但是都可以通过then继续调用promise对象
    return this.then(
      (value) => {
        return MyPromise.resolve(fn()).then(() => value);
      },
      (error) => {
        return MyPromise.resolve(fn()).then(() => {
          throw Error(error);
        });
      }
    );
  };

  catch = (fail) => {
    //   返回捕获的失败结果，直接返回reject
    return this.then(undefined, fail);
  };

  static all = (collection) => {
    const result = [];
    let index = 0;
    return new MyPromise((resolve, reject) => {
      const addData = (key, value) => {
        result[key] = value;
        index++; //执行累加器，用于记录已执行次数
        if (index === collection.length) {
          // 所有结果都执行后返回结果
          resolve(result);
        }
      };
      for (let i = 0, max = collection.length; i < max; i++) {
        const current = collection[i];
        if (current instanceof MyPromise) {
          //   如果这是一个promise对象
          current.then(
            (value) => addData(i, value),
            (reason) => reject(reason)
          );
        } else {
          //   非promise对象
          addData(i, collection[i]);
        }
      }
    });
  };

  static resolve = (value) => {
    // 判断是否为Mypromise 如果是则直接返回 不是则创建Mypromise再返回生成链式调用
    if (value instanceof MyPromise) return value;
    return new MyPromise((resolve) => resolve(value));
  };

  // 只返回第一执行成功的对象
  static race = (collection) => {
    return new MyPromise((resolve, reject) => {
      const addData = (value) => {
        resolve(value); //一旦有结果立即返回，不等待剩余执行结果
      };
      for (let i = 0, max = collection.length; i < max; i++) {
        const current = collection[i];
        if (current instanceof MyPromise) {
          //   如果这是一个promise对象
          current.then(
            (value) => resolve(value),
            (reason) => reject(reason)
          );
        } else {
          //   非promise对象
          addData(current);
        }
      }
    });
  };

  static allSettled = (collection) => {
    // 储存所有结果;
    const result = [];
    let index = 0;
    return new MyPromise((resolve, reject) => {
      // 没有reject情况下保持fulfiled
      let tempStatus = true;
      const addData = (key, value, status) => {
        tempStatus = tempStatus === true && status === FULFILLED ? false : true; //只在出现reject时变更一次
        result[key] = value; //压入所有结果
        index++;
        if (index === collection.length) {
          resolve({ status: tempStatus ? FULFILLED : REJECTED, value: result });
        }
      };
      for (let i = 0, max = collection.length; i < max; i++) {
        const current = collection[i];
        if (current instanceof MyPromise) {
          //   如果这是一个promise对象
          current.then(
            (value) => addData(i, value, 'fulfilled'),
            (reason) => addData(i, reason, 'rejected') // 将错误结果也压入
          );
        } else {
          //   非promise对象
          addData(i, collection[i]);
        }
      }
    });
  };
}

const resolvePromise = (returnPromise, value, resolve, reject) => {
  // 如自己返回自己则报错
  if (returnPromise === value) {
    return reject(new TypeError('asdasdasdasd'));
  }
  if (value instanceof MyPromise) {
    // 是promise对象
    value.then(resolve, reject);
  } else {
    // 非promise对象
    resolve(value);
  }
};

module.exports = MyPromise;
