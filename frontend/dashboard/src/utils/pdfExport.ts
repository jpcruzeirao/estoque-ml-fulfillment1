import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';

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

export const exportProductsToPDF = (products: Product[], title: string = 'Relatório de Produtos') => {
  // Criar nova instância do PDF
  const doc = new jsPDF();
  
  // Adicionar título e data
  const currentDate = new Date().toLocaleDateString('pt-BR');
  doc.setFontSize(18);
  doc.setTextColor(26, 54, 93); // Azul escuro
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${currentDate}`, 14, 30);
  
  // Adicionar logo ou cabeçalho
  doc.setFontSize(12);
  doc.setTextColor(26, 54, 93); // Azul escuro
  doc.text('Sistema de Gestão de Estoque - Fulfillment Mercado Livre', 14, 38);
  
  // Preparar dados para a tabela
  const tableData = products.map(product => [
    product.title,
    product.sku,
    product.ml_item_id,
    product.stock.available,
    product.stock.total,
    product.stock.last_updated 
      ? new Date(product.stock.last_updated).toLocaleDateString('pt-BR')
      : 'Nunca'
  ]);
  
  // Adicionar tabela
  autoTable(doc, {
    startY: 45,
    head: [['Produto', 'SKU', 'ID ML', 'Disponível', 'Total', 'Atualizado']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [26, 54, 93], // Azul escuro
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    rowStyles: {
      minCellHeight: 10
    },
    columnStyles: {
      0: { cellWidth: 60 }, // Produto
      1: { cellWidth: 25 }, // SKU
      2: { cellWidth: 30 }, // ID ML
      3: { cellWidth: 20 }, // Disponível
      4: { cellWidth: 20 }, // Total
      5: { cellWidth: 30 }  // Atualizado
    },
    didDrawPage: (data) => {
      // Adicionar rodapé
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        'Página ' + doc.getNumberOfPages(),
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    }
  });
  
  // Adicionar resumo após a tabela
  const lastAutoTable = (doc as any).lastAutoTable;
  const finalY = lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setTextColor(26, 54, 93); // Azul escuro
  doc.text('Resumo', 14, finalY);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total de produtos: ${products.length}`, 14, finalY + 8);
  doc.text(
    `Produtos com estoque baixo: ${products.filter(p => p.stock.available < 5).length}`,
    14, finalY + 16
  );
  doc.text(
    `Estoque total disponível: ${products.reduce((sum, p) => sum + p.stock.available, 0)} unidades`,
    14, finalY + 24
  );
  
  // Salvar o PDF
  doc.save(`relatorio_produtos_${currentDate.replace(/\//g, '-')}.pdf`);
};

export const exportStockToPDF = (products: Product[], title: string = 'Relatório de Estoque') => {
  // Criar nova instância do PDF
  const doc = new jsPDF();
  
  // Adicionar título e data
  const currentDate = new Date().toLocaleDateString('pt-BR');
  doc.setFontSize(18);
  doc.setTextColor(26, 54, 93); // Azul escuro
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${currentDate}`, 14, 30);
  
  // Adicionar logo ou cabeçalho
  doc.setFontSize(12);
  doc.setTextColor(26, 54, 93); // Azul escuro
  doc.text('Sistema de Gestão de Estoque - Fulfillment Mercado Livre', 14, 38);
  
  // Preparar dados para a tabela
  const tableData = products.map(product => [
    product.title,
    product.sku,
    product.stock.available,
    product.stock.not_available,
    product.stock.total,
    product.stock.last_updated 
      ? new Date(product.stock.last_updated).toLocaleDateString('pt-BR')
      : 'Nunca',
    product.stock.available < 5 ? 'Sim' : 'Não'
  ]);
  
  // Adicionar tabela
  autoTable(doc, {
    startY: 45,
    head: [['Produto', 'SKU', 'Disponível', 'Não Disp.', 'Total', 'Atualizado', 'Estoque Baixo']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [26, 54, 93], // Azul escuro
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    rowStyles: {
      minCellHeight: 10
    },
    columnStyles: {
      0: { cellWidth: 50 }, // Produto
      1: { cellWidth: 25 }, // SKU
      2: { cellWidth: 20 }, // Disponível
      3: { cellWidth: 20 }, // Não Disponível
      4: { cellWidth: 15 }, // Total
      5: { cellWidth: 25 }, // Atualizado
      6: { cellWidth: 25 }  // Estoque Baixo
    },
    didDrawPage: (data) => {
      // Adicionar rodapé
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        'Página ' + doc.getNumberOfPages(),
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    }
  });
  
  // Adicionar resumo após a tabela
  const lastAutoTable = (doc as any).lastAutoTable;
  const finalY = lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setTextColor(26, 54, 93); // Azul escuro
  doc.text('Resumo do Estoque', 14, finalY);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total de produtos: ${products.length}`, 14, finalY + 8);
  doc.text(
    `Produtos com estoque baixo: ${products.filter(p => p.stock.available < 5).length}`,
    14, finalY + 16
  );
  doc.text(
    `Estoque total disponível: ${products.reduce((sum, p) => sum + p.stock.available, 0)} unidades`,
    14, finalY + 24
  );
  doc.text(
    `Estoque total não disponível: ${products.reduce((sum, p) => sum + p.stock.not_available, 0)} unidades`,
    14, finalY + 32
  );
  
  // Adicionar recomendações
  if (products.filter(p => p.stock.available < 5).length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(26, 54, 93); // Azul escuro
    doc.text('Recomendações de Reposição', 14, finalY + 45);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const lowStockProducts = products
      .filter(p => p.stock.available < 5)
      .slice(0, 5);
    
    lowStockProducts.forEach((product, index) => {
      doc.text(
        `${index + 1}. ${product.title}: ${product.stock.available} unidades disponíveis`,
        14, finalY + 55 + (index * 8)
      );
    });
    
    if (products.filter(p => p.stock.available < 5).length > 5) {
      doc.text(
        `... e mais ${products.filter(p => p.stock.available < 5).length - 5} produtos`,
        14, finalY + 55 + (lowStockProducts.length * 8)
      );
    }
  }
  
  // Salvar o PDF
  doc.save(`relatorio_estoque_${currentDate.replace(/\//g, '-')}.pdf`);
};
