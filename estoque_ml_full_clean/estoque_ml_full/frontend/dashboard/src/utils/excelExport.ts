import { utils, writeFile } from 'xlsx';

interface Product {
  id: number;
  sku: string;
  ml_item_id: string;
  ml_inventory_id: string;
  title: string;
  created_at: string;
  stock: {
    total: number;
    available: number;
    not_available: number;
    last_updated: string | null;
  };
}

export const exportProductsToExcel = (products: Product[], fileName: string = 'relatorio_produtos') => {
  // Preparar dados para o Excel
  const worksheetData = products.map(product => ({
    'ID': product.id,
    'Produto': product.title,
    'SKU': product.sku,
    'ID Mercado Livre': product.ml_item_id,
    'Estoque Disponível': product.stock.available,
    'Estoque Total': product.stock.total,
    'Estoque Não Disponível': product.stock.not_available,
    'Última Atualização': product.stock.last_updated 
      ? new Date(product.stock.last_updated).toLocaleString('pt-BR')
      : 'Nunca'
  }));

  // Criar planilha
  const worksheet = utils.json_to_sheet(worksheetData);
  
  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 5 },    // ID
    { wch: 40 },   // Produto
    { wch: 15 },   // SKU
    { wch: 20 },   // ID ML
    { wch: 18 },   // Estoque Disponível
    { wch: 15 },   // Estoque Total
    { wch: 22 },   // Estoque Não Disponível
    { wch: 20 }    // Última Atualização
  ];
  worksheet['!cols'] = columnWidths;

  // Criar workbook e adicionar a planilha
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Produtos');

  // Adicionar planilha de resumo
  const summaryData = [
    { 'Métrica': 'Total de produtos', 'Valor': products.length },
    { 'Métrica': 'Produtos com estoque baixo', 'Valor': products.filter(p => p.stock.available < 5).length },
    { 'Métrica': 'Estoque total disponível', 'Valor': products.reduce((sum, p) => sum + p.stock.available, 0) },
    { 'Métrica': 'Estoque total não disponível', 'Valor': products.reduce((sum, p) => sum + p.stock.not_available, 0) }
  ];
  
  const summarySheet = utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
  utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  // Adicionar planilha de produtos com estoque baixo
  const lowStockProducts = products.filter(p => p.stock.available < 5);
  if (lowStockProducts.length > 0) {
    const lowStockData = lowStockProducts.map(product => ({
      'Produto': product.title,
      'SKU': product.sku,
      'Estoque Disponível': product.stock.available,
      'Estoque Total': product.stock.total
    }));
    
    const lowStockSheet = utils.json_to_sheet(lowStockData);
    lowStockSheet['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
    utils.book_append_sheet(workbook, lowStockSheet, 'Estoque Baixo');
  }

  // Gerar nome do arquivo com data atual
  const currentDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const fullFileName = `${fileName}_${currentDate}.xlsx`;
  
  // Exportar arquivo
  writeFile(workbook, fullFileName);
};

export const exportStockToExcel = (products: Product[], fileName: string = 'relatorio_estoque') => {
  // Preparar dados para o Excel
  const worksheetData = products.map(product => ({
    'Produto': product.title,
    'SKU': product.sku,
    'Estoque Disponível': product.stock.available,
    'Estoque Não Disponível': product.stock.not_available,
    'Estoque Total': product.stock.total,
    'Última Atualização': product.stock.last_updated 
      ? new Date(product.stock.last_updated).toLocaleString('pt-BR')
      : 'Nunca',
    'Estoque Baixo': product.stock.available < 5 ? 'Sim' : 'Não'
  }));

  // Criar planilha
  const worksheet = utils.json_to_sheet(worksheetData);
  
  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 40 },   // Produto
    { wch: 15 },   // SKU
    { wch: 18 },   // Estoque Disponível
    { wch: 22 },   // Estoque Não Disponível
    { wch: 15 },   // Estoque Total
    { wch: 20 },   // Última Atualização
    { wch: 15 }    // Estoque Baixo
  ];
  worksheet['!cols'] = columnWidths;

  // Criar workbook e adicionar a planilha
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Estoque');

  // Adicionar planilha de resumo
  const summaryData = [
    { 'Métrica': 'Total de produtos', 'Valor': products.length },
    { 'Métrica': 'Produtos com estoque baixo', 'Valor': products.filter(p => p.stock.available < 5).length },
    { 'Métrica': 'Estoque total disponível', 'Valor': products.reduce((sum, p) => sum + p.stock.available, 0) },
    { 'Métrica': 'Estoque total não disponível', 'Valor': products.reduce((sum, p) => sum + p.stock.not_available, 0) }
  ];
  
  const summarySheet = utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
  utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  // Adicionar planilha de recomendações
  const lowStockProducts = products.filter(p => p.stock.available < 5);
  if (lowStockProducts.length > 0) {
    const recommendationsData = lowStockProducts.map(product => ({
      'Produto': product.title,
      'SKU': product.sku,
      'Estoque Disponível': product.stock.available,
      'Estoque Total': product.stock.total,
      'Recomendação': 'Repor estoque'
    }));
    
    const recommendationsSheet = utils.json_to_sheet(recommendationsData);
    recommendationsSheet['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 25 }];
    utils.book_append_sheet(workbook, recommendationsSheet, 'Recomendações');
  }

  // Gerar nome do arquivo com data atual
  const currentDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const fullFileName = `${fileName}_${currentDate}.xlsx`;
  
  // Exportar arquivo
  writeFile(workbook, fullFileName);
};
