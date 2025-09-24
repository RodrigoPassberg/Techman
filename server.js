const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

// Importar rotas
const authRoutes = require('./routes/auth');
const equipamentosRoutes = require('./routes/equipamentos');
const comentariosRoutes = require('./routes/comentarios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração de sessão
app.use(session({
    secret: 'techman-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Para desenvolvimento local
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/equipamentos', equipamentosRoutes);
app.use('/api/comentarios', comentariosRoutes);

// Rota principal - servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor TechMan rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});

