# BreakOut Interestelar

Jogo Breakout executado diretamente no navegador, com cadastro local de jogadores, CRUD de jogadores, pesquisa, filtros, ordenação e integração com uma API pública de rastreamento da ISS.

## Executar

Abra `index.html` em um navegador. Não é necessário instalar dependências ou iniciar um servidor.

## Estrutura principal

- `index.html`: estrutura e conteúdo da aplicação.
- `assets/css/style.css`: estilos, layout responsivo e apresentação do jogo.
- `assets/js/game.js`: física, controles, pontuação e recorde local da partida.
- `assets/js/players.js`: cadastro, edição, exclusão, detalhes, pesquisa, filtros, ordenação e consumo da API pública do rastreamento da ISS.
- `assets/video/background.mp4`: vídeo de fundo.

## Funcionalidades

- Cadastro, edição e remoção de jogadores armazenados no `localStorage`.
- Pesquisa por nome, filtro por partidas e ordenação por nome ou data de cadastro.
- Detalhes em painel contextual do jogador selecionado.
- Exibição de dados em tempo real da Estação Espacial Internacional por meio de uma API pública relevante ao tema.
- Jogo com recorde local salvo no navegador.

## Controles

- Setas esquerda/direita ou A/D: mover a raquete.
- Mouse ou toque: posicionar a raquete.
- Espaço ou botão Pausar: pausar e continuar.
- Botões da tela: iniciar, continuar ou reiniciar a partida.
- Em telas menores, use os botões ← e → ou arraste o dedo sobre a área do jogo.

O cadastro e o recorde são salvos apenas no navegador atual. A senha do formulário não é armazenada.
