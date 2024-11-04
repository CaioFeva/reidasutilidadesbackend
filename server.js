const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then(() => console.log("Conectado ao banco de dados PostgreSQL"))
  .catch((err) => console.error("Erro ao conectar ao banco de dados", err));

app.get("/api/produtos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM produto");
    const produtos = result.rows.map((produto) => ({
      ...produto,
      price: produto.price ? parseFloat(produto.price) : 0.0,
    }));
    res.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

app.post('/api/produtos', async (req, res) => {
    const { name, description, price, images, dimensions, weight, stock, category } = req.body;
  
    // Validação básica dos campos obrigatórios
    if (!name || !price || !stock) {
      return res.status(400).json({ error: 'Os campos name, price e stock são obrigatórios' });
    }
  
    try {
      const query = `
        INSERT INTO produto (name, description, price, images, dimensions, weight, stock, category)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
  
      const values = [name, description, price, images, dimensions, weight, stock, category];
  
      // Executa o comando INSERT e retorna o produto inserido
      const result = await pool.query(query, values);
      const newProduct = result.rows[0];
  
      res.status(201).json(newProduct); // Retorna o produto inserido com status 201 (Created)
    } catch (error) {
      console.error('Erro ao inserir produto:', error);
      res.status(500).json({ error: 'Erro ao inserir produto' });
    }
  });

// Endpoint PUT para atualizar um produto existente
app.put("/api/produtos/:id", (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    price,
    images,
    dimensions,
    weight,
    stock,
    category,
  } = req.body;

  // Encontra o produto pelo ID
  const produtoIndex = produtos.findIndex((produto) => produto.id === id);
  if (produtoIndex === -1) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }

  produtos[produtoIndex] = {
    ...produtos[produtoIndex],
    name,
    description,
    price,
    images,
    dimensions,
    weight,
    stock,
    category,
  };

  res.json(produtos[produtoIndex]);
});

// Endpoint DELETE para excluir um produto
app.delete("/api/produtos/:id", (req, res) => {
  const { id } = req.params;

  const produtoExistente = produtos.find((produto) => produto.id === id);
  if (!produtoExistente) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }

  produtos = produtos.filter((produto) => produto.id !== id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
