import test from "node:test";
import assert from "node:assert/strict";
import {
  completionXp,
  createInitialLabState,
  discoveries,
  discoveryIds,
  exploratoryReducer,
  getCartTotal,
  getDiscoveryXp,
  getStockMessage,
  isReviewComplete,
} from "../core/exploratory-lab.js";

function act(state, type, values = {}) {
  return exploratoryReducer(state, { type, ...values });
}

test("the four discoveries retain their copy and award 15 XP each", () => {
  assert.deepEqual(discoveryIds, ["stock", "coupon", "address", "checkout"]);
  assert.deepEqual(
    Object.values(discoveries).map(({ points }) => points),
    [15, 15, 15, 15],
  );

  let state = createInitialLabState();
  for (let count = 0; count <= 5; count++)
    state = act(state, "increase-quantity");
  state = act(state, "set-coupon-input", { value: "FVR10" });
  state = act(state, "apply-coupon");
  state = act(state, "remove-coupon");
  state = act(state, "set-address", { value: "Rua #1" });
  state = act(state, "inspect-address");
  state = act(state, "set-address", { value: "" });
  state = act(state, "finish-order");
  assert.deepEqual(state.discovered, discoveryIds);
  assert.equal(getDiscoveryXp(state), 60);
});

test("stock discovery starts above five and repeated actions do not duplicate it", () => {
  let state = createInitialLabState();
  for (let count = 0; count < 5; count++)
    state = act(state, "increase-quantity");
  assert.deepEqual(state.discovered, []);

  state = act(state, "increase-quantity");
  state = act(state, "increase-quantity");
  assert.deepEqual(state.discovered, ["stock"]);
  assert.equal(state.quantity, 7);
  assert.equal(getStockMessage(0), "Adicione um item para começar.");
  assert.equal(getStockMessage(4), "Estoque disponível: 1 unidades.");
  assert.equal(getStockMessage(6), "Estoque disponível: 5 unidades.");
});

test("coupon removal keeps the discount, invalid coupon copy, and refresh behavior", () => {
  let state = createInitialLabState();
  state = act(state, "set-coupon-input", { value: "  fvr10 " });
  state = act(state, "apply-coupon");
  state = act(state, "add-product");
  assert.equal(state.couponApplied, true);
  assert.equal(getCartTotal(state), 170.91);

  state = act(state, "remove-coupon");
  assert.equal(state.couponApplied, false);
  assert.equal(state.discountStuck, true);
  assert.equal(getCartTotal(state), 170.91);
  assert.deepEqual(state.discovered, ["coupon"]);

  state = act(state, "set-coupon-input", { value: "unknown" });
  state = act(state, "apply-coupon");
  assert.equal(state.couponMessage, "Cupom não encontrado.");

  let refreshed = createInitialLabState();
  refreshed = act(refreshed, "set-coupon-input", { value: "FVR10" });
  refreshed = act(refreshed, "apply-coupon");
  refreshed = act(refreshed, "add-product");
  refreshed = act(refreshed, "set-address", { value: "Rua #1" });
  refreshed = act(refreshed, "set-cep", { value: "01000-000" });
  refreshed = act(refreshed, "simulated-refresh");
  assert.equal(refreshed.view, "cart");
  assert.equal(refreshed.quantity, 0);
  assert.equal(refreshed.couponApplied, false);
  assert.equal(refreshed.discountStuck, false);
  assert.equal(refreshed.removeCouponVisible, true);
  assert.equal(refreshed.address, "Rua #1");
  assert.equal(refreshed.cep, "01000-000");
  refreshed = act(refreshed, "remove-coupon");
  assert.deepEqual(refreshed.discovered, ["coupon"]);

  state = act(state, "set-address", { value: "Rua #1" });
  state = act(state, "set-cep", { value: "01000-000" });
  state = act(state, "simulated-refresh");
  assert.equal(state.view, "cart");
  assert.equal(state.quantity, 0);
  assert.equal(state.couponApplied, false);
  assert.equal(state.discountStuck, false);
  assert.equal(state.removeCouponVisible, false);
  assert.equal(state.address, "Rua #1");
  assert.equal(state.cep, "01000-000");
  assert.deepEqual(state.discovered, ["coupon"]);
});

test("address and checkout discoveries keep their current validation behavior", () => {
  let state = createInitialLabState();
  state = act(state, "set-address", { value: "Rua #1" });
  state = act(state, "inspect-address");
  state = act(state, "inspect-address");
  assert.deepEqual(state.discovered, ["address"]);
  assert.equal(
    state.checkoutMessage,
    "Endereço inválido. Remova caracteres especiais.",
  );

  state = act(state, "finish-order");
  assert.deepEqual(state.discovered, ["address", "checkout"]);
  assert.match(state.checkoutMessage, /Pedido #FF-2048 confirmado/);

  state = act(state, "set-address", { value: "Rua válida, 20" });
  state = act(state, "set-cep", { value: "01000-000" });
  state = act(state, "finish-order");
  assert.equal(state.checkoutMessage, "Pedido enviado para análise.");
  assert.deepEqual(state.discovered, ["address", "checkout"]);
});

test("review requires all four unique findings; incomplete and restart states reset", () => {
  let state = createInitialLabState();
  assert.equal(completionXp, 100);
  assert.equal(isReviewComplete([]), false);
  assert.equal(isReviewComplete(discoveryIds.slice(0, 3)), false);
  assert.equal(isReviewComplete([...discoveryIds, "stock"]), false);
  assert.equal(isReviewComplete(discoveryIds), true);

  state = act(state, "review-incomplete");
  assert.match(state.reviewError, /quatro evidências/);
  state = act(state, "toggle-evidence", { id: "stock" });
  assert.equal(state.reviewError, "");
  state = act(state, "restart");
  assert.deepEqual(state, createInitialLabState());
});
