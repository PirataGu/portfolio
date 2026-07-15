// Adicionar uma pequena sombra extra à aba quando se faz scroll
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
  } else {
    navbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
  }
});

// 
// Animação da Hero Image após Carregar
// 
const heroImg = document.getElementById('hero-img');
if (heroImg) {
  // Randomizar a imagem de fundo
  if (Math.random() > 0.20) {
    heroImg.src = "https://www.dropbox.com/scl/fi/avyasb04jcd64k3uvvncg/eusite.jpg?rlkey=ri7skd1fm6puw3tzfl6rxgeut&st=7lbeqt9i&dl=1";
  } else {
    heroImg.src = "https://www.dropbox.com/scl/fi/chexs4mo697bqa8tbegl5/eusite1.jpg?rlkey=hbzcwgy0vd9i09hr5y1atp7lc&st=fo2wvzu8&dl=1";
  }

  // Se já estiver carregada (cache), anima logo
  if (heroImg.complete) {
    heroImg.classList.add('loaded');
  } else {
    // Espera pelo download completo para animar
    heroImg.addEventListener('load', () => {
      heroImg.classList.add('loaded');
    });
  }
}

// 
// Lógica do Leitor PDF (PDF.js) e Modal
// 
let pdfDoc = null,
  pageNum = 1,
  pageIsRendering = false,
  pageNumIsPending = null;

const scale = 3, // Resolução/Zoom do PDF
  canvas = document.querySelector('#pdf-render'),
  ctx = canvas.getContext('2d'),
  modal = document.getElementById('pdf-modal'),
  closeBtn = document.getElementById('close-modal');

// Renderizar a Página
const renderPage = num => {
  pageIsRendering = true;

  // Obter a página pretendida
  pdfDoc.getPage(num).then(page => {
    // Definir as dimensões do canvas
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderCtx = {
      canvasContext: ctx,
      viewport: viewport
    };

    // Fazer render da página
    page.render(renderCtx).promise.then(() => {
      pageIsRendering = false;

      // Se havia uma página pendente na fila, desenha a pendente
      if (pageNumIsPending !== null) {
        renderPage(pageNumIsPending);
        pageNumIsPending = null;
      }
    });

    // Atualizar UI da contagem de páginas
    document.querySelector('#page-num').textContent = num;
  });
};

// Verificação de filas para rendering
const queueRenderPage = num => {
  if (pageIsRendering) {
    pageNumIsPending = num;
  } else {
    renderPage(num);
  }
};

// Página Anterior
const showPrevPage = () => {
  if (pageNum <= 1) {
    console.log("Já estás na primeira página, indo para a última");
    pageNum = pdfDoc.numPages;
    queueRenderPage(pageNum);
  } else {
    pageNum--;
    queueRenderPage(pageNum);
    console.log("Prev Clicado", pageNum);
  }

};

// Página Seguinte
const showNextPage = () => {
  if (pageNum >= pdfDoc.numPages) {
    console.log("Já estás na última página, indo para a primeira!");
    pageNum = 1;
    queueRenderPage(pageNum);
  } else {
    pageNum++;
    queueRenderPage(pageNum);
    console.log("Next Clicado", pageNum);
  }
};

// Página Final
const lastPage = () => {
  console.log("Indo para a última página.");
  pageNum = pdfDoc.numPages;
  queueRenderPage(pageNum);
};

// Página Inicial
const firstPage = () => {
  console.log("Indo para a primeira página.");
  pageNum = 1;
  queueRenderPage(pageNum);
};

// 
// Eventos de Abertura/Fecho e Proteção
// 

// Prevenir o clique direito (Menu de contexto) no canvas
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Associar eventos aos botões Anterior/Próximo (Topo e Lado)
document.querySelector('#first-page').addEventListener('click', firstPage);
document.querySelector('#last-page').addEventListener('click', lastPage);
document.querySelector('#prev-page-side').addEventListener('click', showPrevPage);
document.querySelector('#next-page-side').addEventListener('click', showNextPage);

// Função para Carregar e Abrir o PDF
function openPdfModal(pdfUrl) {
  // Mostra o Modal
  modal.style.display = 'block';

  // Limpar canvas/texto antes de carregar o novo
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.querySelector('#page-num').textContent = ' ';
  document.querySelector('#page-count').textContent = ' ';

  // Obter o Documento PDF
  pdfjsLib.getDocument(pdfUrl).promise.then(pdfDoc_ => {
    pdfDoc = pdfDoc_;
    document.querySelector('#page-count').textContent = pdfDoc.numPages;

    // Reset para a página 1 e renderizar
    pageNum = 1;
    renderPage(pageNum);
  }).catch(err => {
    // Lidar com o erro
    console.error("Erro ao carregar o PDF: ", err);
    ctx.font = "20px Arial";
    ctx.fillStyle = "red";
    ctx.fillText("Relatório disponível em breve ou erro a carregar.", 50, 100);
  });
}

// Associar os cartões de projeto para abrir o modal
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
  card.addEventListener('click', () => {
    const pdfPath = card.getAttribute('data-pdf');
    if (pdfPath) {
      openPdfModal(pdfPath);
    }
  });
});

// Fechar o modal no botão 'X'
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
  pdfDoc = null; // Limpa da memória
});

// Fechar o modal clicando fora dele
window.addEventListener('click', e => {
  if (e.target == modal) {
    modal.style.display = 'none';
    pdfDoc = null;
  }
});