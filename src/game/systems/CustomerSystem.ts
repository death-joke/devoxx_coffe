import { Order, Customer, DrinkType, ItemType, LevelConfig } from '../types/index';
import { DRINK_REQUIRED_ITEM } from '../types/constants';

type CustomerCallback = (customer: Customer) => void;

export class CustomerSystem {
  private customers: Customer[] = [];
  private orderCounter = 0;
  private customerCounter = 0;
  private spawnTimer = 0;
  private spawnInterval: number;
  private orderTimeout: number;
  private maxClients: number;
  private availableDrinks: DrinkType[];
  private totalSpawned = 0;
  private started = false;
  private pauseStartTime: number | null = null;

  private onCustomerArrival: CustomerCallback[] = [];
  private onOrderServed: Array<(customer: Customer, points: number) => void> = [];
  private onOrderFailed: CustomerCallback[] = [];

  constructor(level: LevelConfig) {
    this.spawnInterval = level.clientSpawnIntervalMs;
    this.orderTimeout = level.orderTimeoutMs;
    this.maxClients = level.clientCount;
    this.availableDrinks = level.availableDrinks;
  }

  onArrival(cb: CustomerCallback): void { this.onCustomerArrival.push(cb); }
  onServed(cb: (customer: Customer, points: number) => void): void { this.onOrderServed.push(cb); }
  onFailed(cb: CustomerCallback): void { this.onOrderFailed.push(cb); }

  start(): void { this.started = true; }
  get isStarted(): boolean { return this.started; }

  pause(): void {
    if (this.pauseStartTime === null) {
      this.pauseStartTime = Date.now();
    }
  }

  resume(): void {
    if (this.pauseStartTime === null) return;
    const pausedDuration = Date.now() - this.pauseStartTime;
    this.pauseStartTime = null;
    for (const customer of this.customers) {
      customer.order.startedAt += pausedDuration;
    }
  }

  get activeCustomers(): Customer[] { return [...this.customers]; }
  get totalSpawnedCount(): number { return this.totalSpawned; }
  get hasMoreCustomers(): boolean { return this.totalSpawned < this.maxClients || this.customers.length > 0; }

  private randomDrink(): DrinkType {
    return this.availableDrinks[Math.floor(Math.random() * this.availableDrinks.length)];
  }

  private createOrder(drinkType: DrinkType): Order {
    return {
      id: `order_${++this.orderCounter}`,
      drinkType,
      requiredItem: DRINK_REQUIRED_ITEM[drinkType],
      timeoutMs: this.orderTimeout,
      startedAt: Date.now(),
    };
  }

  update(deltaMs: number): void {
    if (!this.started) return;

    if (this.totalSpawned >= this.maxClients) {
      // Only update timers for existing customers
      this.updateTimers(deltaMs);
      return;
    }

    this.spawnTimer += deltaMs;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnCustomer();
    }

    this.updateTimers(deltaMs);
  }

  private spawnCustomer(): void {
    const drink = this.randomDrink();
    const order = this.createOrder(drink);
    const customer: Customer = {
      id: `customer_${++this.customerCounter}`,
      order,
    };
    this.customers.push(customer);
    this.totalSpawned++;
    this.onCustomerArrival.forEach(cb => cb(customer));
  }

  private updateTimers(_deltaMs: number): void {
    const toRemove: string[] = [];

    for (const customer of this.customers) {
      const elapsed = Date.now() - customer.order.startedAt;
      if (elapsed >= customer.order.timeoutMs) {
        toRemove.push(customer.id);
        this.onOrderFailed.forEach(cb => cb(customer));
      }
    }

    this.customers = this.customers.filter(c => !toRemove.includes(c.id));
  }

  tryServeItem(item: ItemType): Customer | null {
    for (const customer of this.customers) {
      if (customer.order.requiredItem === item) {
        this.customers = this.customers.filter(c => c.id !== customer.id);
        const elapsed = Date.now() - customer.order.startedAt;
        const ratio = 1 - elapsed / customer.order.timeoutMs;
        const points = Math.max(50, Math.round(100 * ratio));
        this.onOrderServed.forEach(cb => cb(customer, points));
        return customer;
      }
    }
    return null;
  }

  getOrderProgress(customer: Customer): number {
    const elapsed = Date.now() - customer.order.startedAt;
    return Math.max(0, 1 - elapsed / customer.order.timeoutMs);
  }

  reset(): void {
    this.customers = [];
    this.spawnTimer = 0;
    this.totalSpawned = 0;
    this.orderCounter = 0;
    this.customerCounter = 0;
    this.started = false;
  }
}
