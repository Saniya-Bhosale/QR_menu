import { useMemo, useState } from 'react'
import './App.css'

type View = 'customer' | 'manager' | 'billing'
type Status = 'Pending' | 'Preparing' | 'Served'

type MenuItem = {
  id: number
  name: string
  category: string
  price: number
  description: string
}

type Order = {
  id: number
  tableId: string
  items: { itemId: number; name: string; quantity: number; price: number }[]
  status: Status
  placedAt: string
}

const menuItems: MenuItem[] = [
  { id: 1, name: 'Garlic Paneer Tikka', category: 'Starters', price: 180, description: 'Char-grilled and served hot.' },
  { id: 2, name: 'Crispy Fries', category: 'Starters', price: 120, description: 'Quick snack for every table.' },
  { id: 3, name: 'Veg Burger', category: 'Main Course', price: 220, description: 'Simple, filling, and fast to prepare.' },
  { id: 4, name: 'Paneer Butter Masala', category: 'Main Course', price: 280, description: 'A popular dining room favorite.' },
  { id: 5, name: 'Cold Coffee', category: 'Drinks', price: 90, description: 'Chilled and served instantly.' },
  { id: 6, name: 'Fresh Lime Soda', category: 'Drinks', price: 80, description: 'Refreshing and light.' },
]

const categoryOrder = ['Starters', 'Main Course', 'Drinks']

const initialOrders: Order[] = [
  {
    id: 101,
    tableId: 'T-04',
    items: [
      { itemId: 3, name: 'Veg Burger', quantity: 2, price: 220 },
      { itemId: 5, name: 'Cold Coffee', quantity: 1, price: 90 },
    ],
    status: 'Preparing',
    placedAt: '12:14 PM',
  },
  {
    id: 102,
    tableId: 'T-11',
    items: [
      { itemId: 1, name: 'Garlic Paneer Tikka', quantity: 1, price: 180 },
      { itemId: 4, name: 'Paneer Butter Masala', quantity: 1, price: 280 },
    ],
    status: 'Pending',
    placedAt: '12:22 PM',
  },
]

const statusCycle: Record<Status, Status> = {
  Pending: 'Preparing',
  Preparing: 'Served',
  Served: 'Served',
}

function currency(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`
}

function App() {
  const [activeView, setActiveView] = useState<View>('customer')
  const [cart, setCart] = useState<Record<number, number>>({ 2: 1, 5: 2 })
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selectedTableId, setSelectedTableId] = useState('T-07')
  const [selectedBillOrderId, setSelectedBillOrderId] = useState(initialOrders[0].id)
  const [extraCharge, setExtraCharge] = useState('0')
  const [discount, setDiscount] = useState('0')

  const categories = useMemo(
    () =>
      categoryOrder.map((category) => ({
        category,
        items: menuItems.filter((item) => item.category === category),
      })),
    [],
  )

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const item = menuItems.find((menuItem) => menuItem.id === Number(id))
          if (!item) return null

          return {
            ...item,
            quantity,
            lineTotal: item.price * quantity,
          }
        })
        .filter((item): item is MenuItem & { quantity: number; lineTotal: number } => item !== null),
    [cart],
  )

  const cartTotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0)

  const selectedBillOrder = orders.find((order) => order.id === selectedBillOrderId) ?? orders[0]
  const billSubTotal = selectedBillOrder
    ? selectedBillOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0
  const extraChargeValue = Number(extraCharge) || 0
  const discountValue = Number(discount) || 0
  const finalBill = Math.max(billSubTotal + extraChargeValue - discountValue, 0)

  const addItem = (itemId: number) => {
    setCart((currentCart) => ({
      ...currentCart,
      [itemId]: (currentCart[itemId] ?? 0) + 1,
    }))
  }

  const removeItem = (itemId: number) => {
    setCart((currentCart) => {
      const nextQuantity = (currentCart[itemId] ?? 0) - 1

      if (nextQuantity <= 0) {
        const nextCart = { ...currentCart }
        delete nextCart[itemId]
        return nextCart
      }

      return {
        ...currentCart,
        [itemId]: nextQuantity,
      }
    })
  }

  const placeOrder = () => {
    if (cartItems.length === 0) return

    const nextOrder: Order = {
      id: Date.now(),
      tableId: selectedTableId,
      items: cartItems.map((item) => ({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      status: 'Pending',
      placedAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }

    setOrders((currentOrders) => [nextOrder, ...currentOrders])
    setSelectedBillOrderId(nextOrder.id)
    setActiveView('manager')
    setCart({})
  }

  const updateOrderStatus = (orderId: number) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: statusCycle[order.status],
            }
          : order,
      ),
    )
  }

  const removeOrder = (orderId: number) => {
    setOrders((currentOrders) => {
      const remainingOrders = currentOrders.filter((order) => order.id !== orderId)
      setSelectedBillOrderId(remainingOrders[0]?.id ?? 0)
      return remainingOrders
    })
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">QR</div>
          <p className="eyebrow">Smart restaurant workflow</p>
          <h1>QR-based ordering UI</h1>
          <p className="lede">
            Customer menu, live manager dashboard, and billing screen in one clean interface.
          </p>
        </div>

        <div className="table-card">
          <span>Table</span>
          <strong>{selectedTableId}</strong>
          <p>Auto-filled from the QR code when a customer scans the table.</p>
        </div>

        <nav className="view-switcher" aria-label="Views">
          <button className={activeView === 'customer' ? 'active' : ''} onClick={() => setActiveView('customer')}>
            Customer Menu
          </button>
          <button className={activeView === 'manager' ? 'active' : ''} onClick={() => setActiveView('manager')}>
            Manager Dashboard
          </button>
          <button className={activeView === 'billing' ? 'active' : ''} onClick={() => setActiveView('billing')}>
            Billing
          </button>
        </nav>

        <div className="stats-grid">
          <div>
            <strong>{orders.length}</strong>
            <span>Live orders</span>
          </div>
          <div>
            <strong>{cartItems.length}</strong>
            <span>Cart items</span>
          </div>
          <div>
            <strong>{currency(cartTotal)}</strong>
            <span>Current cart</span>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">{activeView === 'customer' ? 'Customer UI' : activeView === 'manager' ? 'Operations panel' : 'Billing UI'}</p>
            <h2>
              {activeView === 'customer'
                ? 'Scan, order, and pay from the table'
                : activeView === 'manager'
                  ? 'Track orders in real time'
                  : 'Generate a clean final bill'}
            </h2>
          </div>
          <div className="pill-row">
            <span>QR identification</span>
            <span>Live updates</span>
            <span>Manual edits</span>
          </div>
        </header>

        {activeView === 'customer' && (
          <div className="screen-grid">
            <section className="panel customer-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Digital menu</p>
                  <h3>Simple mobile ordering</h3>
                </div>
                <label className="table-select">
                  Table ID
                  <select value={selectedTableId} onChange={(event) => setSelectedTableId(event.target.value)}>
                    {['T-01', 'T-04', 'T-07', 'T-11', 'T-14'].map((tableId) => (
                      <option key={tableId} value={tableId}>
                        {tableId}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="menu-list">
                {categories.map(({ category, items }) => (
                  <article className="menu-group" key={category}>
                    <div className="menu-group-head">
                      <h4>{category}</h4>
                      <span>{items.length} items</span>
                    </div>
                    <div className="menu-cards">
                      {items.map((item) => (
                        <div className="menu-card" key={item.id}>
                          <div>
                            <strong>{item.name}</strong>
                            <p>{item.description}</p>
                          </div>
                          <div className="menu-card-footer">
                            <span>{currency(item.price)}</span>
                            <div className="quantity-controls">
                              <button onClick={() => removeItem(item.id)}>-</button>
                              <strong>{cart[item.id] ?? 0}</strong>
                              <button onClick={() => addItem(item.id)}>+</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="panel cart-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Cart</p>
                  <h3>Review before placing order</h3>
                </div>
                <span className="status status-warm">No login required</span>
              </div>

              <div className="cart-items">
                {cartItems.length === 0 ? (
                  <div className="empty-state">
                    <strong>Your cart is empty</strong>
                    <p>Add menu items to create the order for the manager dashboard.</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div className="cart-row" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.quantity} x {currency(item.price)}
                        </p>
                      </div>
                      <span>{currency(item.lineTotal)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="total-box">
                <span>Total</span>
                <strong>{currency(cartTotal)}</strong>
              </div>

              <button className="primary-button" onClick={placeOrder} disabled={cartItems.length === 0}>
                Place Order
              </button>

              <p className="hint">Order goes directly to the live manager board with the table ID attached.</p>
            </aside>
          </div>
        )}

        {activeView === 'manager' && (
          <section className="panel dashboard-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Manager dashboard</p>
                <h3>Live order queue</h3>
              </div>
              <span className="status status-live">Real-time view</span>
            </div>

            <div className="order-grid">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-top">
                    <div>
                      <strong>{order.tableId}</strong>
                      <p>{order.placedAt}</p>
                    </div>
                    <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
                  </div>

                  <div className="order-items">
                    {order.items.map((item) => (
                      <div key={item.itemId}>
                        <span>
                          {item.quantity} x {item.name}
                        </span>
                        <strong>{currency(item.quantity * item.price)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="order-actions">
                    <button onClick={() => updateOrderStatus(order.id)}>Update Status</button>
                    <button className="ghost" onClick={() => setActiveView('billing')}>
                      Open Bill
                    </button>
                    <button className="danger" onClick={() => removeOrder(order.id)}>
                      Completed
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'billing' && (
          <section className="screen-grid billing-grid">
            <section className="panel billing-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Billing</p>
                  <h3>Automatic bill with manual edits</h3>
                </div>
                <label className="table-select">
                  Order
                  <select value={selectedBillOrder?.id ?? ''} onChange={(event) => setSelectedBillOrderId(Number(event.target.value))}>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.tableId} - {order.status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedBillOrder && (
                <div className="bill-list">
                  {selectedBillOrder.items.map((item) => (
                    <div className="bill-row" key={item.itemId}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.quantity} x {currency(item.price)}
                        </p>
                      </div>
                      <span>{currency(item.quantity * item.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="panel summary-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Final total</p>
                  <h3>Adjust the bill before printing</h3>
                </div>
              </div>

              <label>
                Extra charges
                <input type="number" value={extraCharge} onChange={(event) => setExtraCharge(event.target.value)} />
              </label>
              <label>
                Discount
                <input type="number" value={discount} onChange={(event) => setDiscount(event.target.value)} />
              </label>

              <div className="bill-summary">
                <div>
                  <span>Subtotal</span>
                  <strong>{currency(billSubTotal)}</strong>
                </div>
                <div>
                  <span>Extra charges</span>
                  <strong>{currency(extraChargeValue)}</strong>
                </div>
                <div>
                  <span>Discount</span>
                  <strong>-{currency(discountValue)}</strong>
                </div>
                <div className="total-box accent">
                  <span>Grand total</span>
                  <strong>{currency(finalBill)}</strong>
                </div>
              </div>

              <button className="primary-button">Generate Bill</button>
              <p className="hint">This screen is meant for cashier staff to apply small manual adjustments quickly.</p>
            </aside>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
