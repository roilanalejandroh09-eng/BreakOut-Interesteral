# BreakOut Interestelar

Jogo Breakout executado diretamente no navegador, com cadastro local de jogadores.

## Executar

Abra `index.html` em um navegador. Não é necessário instalar dependências ou iniciar um servidor.

## Estrutura principal

- `index.html`: estrutura e conteúdo da aplicação.
- `assets/css/style.css`: estilos, layout responsivo e apresentação do jogo.
- `assets/js/game.js`: física, controles, pontuação e recorde local da partida.
- `assets/js/players.js`: cadastro, pesquisa, filtros e gerenciamento local de jogadores.
- `assets/video/background.mp4`: vídeo de fundo.

## Controles

- Setas esquerda/direita ou A/D: mover a raquete.
- Mouse ou toque: posicionar a raquete.
- Espaço ou botão Pausar: pausar e continuar.
- Botões da tela: iniciar, continuar ou reiniciar a partida.
- Em telas menores, use os botões ← e → ou arraste o dedo sobre a área do jogo.

O cadastro e o recorde são salvos apenas no navegador atual. A senha do formulário não é armazenada.
