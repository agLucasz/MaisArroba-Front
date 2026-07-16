import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../Pages/Home';
import Catalogo from '../Pages/Catalogo';
import Carrinho from '../Pages/Carrinho';
import Checkout from '../Pages/Checkout';
import CheckoutRetorno from '../Pages/CheckoutRetorno';
import Cadastro from '../Pages/Cadastro';
import LoginComprador from '../Pages/LoginComprador';
import MinhaContaComprador from '../Pages/MinhaContaComprador';
import Login from '../Pages/Login';
import Dashboard from '../Pages/Admin/Dashboard';
import Categoria from '../Pages/Admin/Categoria/Categoria';
import Produto from '../Pages/Admin/Produto/Produto';
import FormaPagamento from '../Pages/Admin/Pagamento/FormaPagamento';
import Pedido from '../Pages/Admin/Pedido/Pedido';
import Relatorio from '../Pages/Admin/Relatorio/Relatorio';
import Estoque from '../Pages/Admin/Estoque/Estoque';
import Cliente from '../Pages/Admin/Cliente/Cliente';
import Contato from '../Pages/Contato';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/"               element={<Home />} />
    <Route path="/loja"           element={<Catalogo />} />
    <Route path="/login"          element={<Login />} />
    <Route path="/dashboard"      element={<Dashboard />} />
    <Route path="/categorias"     element={<Categoria />} />
    <Route path="/produtos"       element={<Produto />} />
    <Route path="/pedidos"        element={<Pedido />} />
    <Route path="/pagamentos"     element={<FormaPagamento />} />
    <Route path="/clientes"       element={<Cliente />} />
    <Route path="/estoque"        element={<Estoque />} />
    <Route path="/relatorios"     element={<Relatorio />} />
    <Route path="/carrinho"        element={<Carrinho />} />
    <Route path="/checkout"        element={<Checkout />} />
    <Route path="/checkout/sucesso"  element={<CheckoutRetorno resultado="sucesso" />} />
    <Route path="/checkout/pendente" element={<CheckoutRetorno resultado="pendente" />} />
    <Route path="/checkout/erro"     element={<CheckoutRetorno resultado="erro" />} />
    <Route path="/cadastro"        element={<Cadastro />} />
    <Route path="/login-comprador" element={<LoginComprador />} />
    <Route path="/minha-conta"     element={<MinhaContaComprador />} />
    <Route path="/contato"         element={<Contato />} />
    <Route path="*"               element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
