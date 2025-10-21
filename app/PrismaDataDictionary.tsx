"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Copy,
  Check,
  FileDown,
  Edit3,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Field {
  number: number;
  name: string;
  isPK: string;
  isFK: string;
  isMandatory: string;
  type: string;
  typeCategory: string;
  origin: string;
  formula: string;
  description: string;
}

interface Table {
  name: string;
  description: string;
  columnCount: number;
  rowCount: string;
  fields: Field[];
}

export default function PrismaDataDictionary() {
  const [schema, setSchema] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDescriptions, setEditingDescriptions] = useState<
    Record<string, string>
  >({});

  const parseSchema = (schemaText: string) => {
    const models: Table[] = [];
    const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g;
    let match;

    while ((match = modelRegex.exec(schemaText)) !== null) {
      const modelName = match[1];
      const modelBody = match[2];

      const fields: Field[] = [];
      const fieldLines = modelBody
        .split("\n")
        .filter(
          (line) =>
            line.trim() &&
            !line.trim().startsWith("//") &&
            !line.trim().startsWith("@@")
        );

      let fieldNumber = 1;
      fieldLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Parse field: fieldName Type @attributes
        const fieldMatch = trimmed.match(/(\w+)\s+(\w+)(\[\])?(\?)?(.*)$/);
        if (fieldMatch) {
          const [, fieldName, fieldType, isArray, isOptional, attributes] =
            fieldMatch;

          const isPK =
            attributes.includes("@id") || attributes.includes("@unique");
          const isFK = attributes.includes("@relation");
          const isMandatory =
            !isOptional &&
            fieldType !== "DateTime" &&
            !attributes.includes("@default");

          // Extract default value
          let defaultValue = "";
          const defaultMatch = attributes.match(/@default\((.*?)\)/);
          if (defaultMatch) {
            defaultValue = defaultMatch[1];
          }

          // Extract description from /// comments
          const descMatch = modelBody.match(
            new RegExp(`///\\s*(.*)\\n.*${fieldName}\\s+${fieldType}`)
          );
          const description = descMatch ? descMatch[1].trim() : "";

          // Map Prisma types to SQL types
          const typeMapping: Record<string, string> = {
            String: "VARCHAR",
            Int: "INTEGER",
            BigInt: "BIGINT",
            Float: "FLOAT",
            Decimal: "DECIMAL",
            Boolean: "BOOLEAN",
            DateTime: "TIMESTAMP",
            Json: "JSON",
            Bytes: "BYTEA",
          };

          const sqlType = typeMapping[fieldType] || fieldType.toUpperCase();
          const dataType = isArray ? `${sqlType}[]` : sqlType;

          fields.push({
            number: fieldNumber++,
            name: fieldName,
            isPK: isPK ? "X" : "-",
            isFK: isFK ? "X" : "-",
            isMandatory: isMandatory ? "X" : "-",
            type: dataType,
            typeCategory:
              sqlType.includes("CHAR") || sqlType.includes("TEXT")
                ? "tipo caractere"
                : sqlType.includes("INT") ||
                  sqlType.includes("NUMERIC") ||
                  sqlType.includes("DECIMAL")
                ? "tipo numérico"
                : sqlType.includes("DATE") || sqlType.includes("TIME")
                ? "tipo data/hora"
                : sqlType.includes("BOOLEAN")
                ? "tipo booleano"
                : "tipo nativo",
            origin: "nativo do banco de dados",
            formula: defaultValue || "-",
            description:
              description || `Campo ${fieldName} da tabela ${modelName}`,
          });
        }
      });

      // Extract table description from model comments
      const modelCommentMatch = schemaText.match(
        new RegExp(`///\\s*(.*)\\n.*model\\s+${modelName}`)
      );
      const tableDescription = modelCommentMatch
        ? modelCommentMatch[1].trim()
        : `Tabela ${modelName}`;

      models.push({
        name: modelName.toUpperCase(),
        description: tableDescription,
        columnCount: fields.length,
        rowCount: "-",
        fields: fields,
      });
    }

    setTables(models);
  };

  const handleGenerate = () => {
    if (schema.trim()) {
      parseSchema(schema);
      // Initialize editing descriptions with current descriptions
      const initialDescriptions: Record<string, string> = {};
      const models: Table[] = [];
      const modelRegex = /model\s+(\w+)\s*{([^}]*)}/g;
      let match;

      while ((match = modelRegex.exec(schema)) !== null) {
        const modelName = match[1];
        const modelBody = match[2];
        const fields: Field[] = [];
        const fieldLines = modelBody
          .split("\n")
          .filter(
            (line) =>
              line.trim() &&
              !line.trim().startsWith("//") &&
              !line.trim().startsWith("@@")
          );

        let fieldNumber = 1;
        fieldLines.forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed) return;

          const fieldMatch = trimmed.match(/(\w+)\s+(\w+)(\[\])?(\?)?(.*)$/);
          if (fieldMatch) {
            const [, fieldName, fieldType] = fieldMatch;
            const descMatch = modelBody.match(
              new RegExp(`///\\s*(.*)\\n.*${fieldName}\\s+${fieldType}`)
            );
            const description = descMatch
              ? descMatch[1].trim()
              : `Campo ${fieldName} da tabela ${modelName}`;

            const key = `${modelName}_${fieldName}`;
            initialDescriptions[key] = description;
          }
        });
      }

      setEditingDescriptions(initialDescriptions);
    }
  };

  const generateMarkdown = () => {
    let markdown = "";

    tables.forEach((table, idx) => {
      markdown += `## Tabela ${String(idx + 1).padStart(3, "0")}\n\n`;
      markdown += `**Nome da Tabela:** ${table.name}\n\n`;
      markdown += `**Descrição:** ${table.description}\n\n`;
      markdown += `**Número de Colunas:** ${table.columnCount}\n\n`;
      markdown += `**Número de Linhas (atual):** ${table.rowCount}\n\n`;
      markdown += `*PK = Primary Key (chave primária) | FK = Foreign Key (chave estrangeira) | M = Mandatory (campo obrigatório)*\n\n`;

      markdown += `### Colunas\n\n`;
      markdown += `| No. | Nome da Coluna | PK | FK | M | Tipo do dado | Espécie do tipo | Origem | Fórmula |\n`;
      markdown += `|-----|----------------|----|----|---|--------------|-----------------|--------|----------|\n`;

      table.fields.forEach((field) => {
        markdown += `| ${field.number} | ${field.name} | ${field.isPK} | ${field.isFK} | ${field.isMandatory} | ${field.type} | ${field.typeCategory} | ${field.origin} | ${field.formula} |\n`;
      });

      markdown += `\n### Descrição das Colunas\n\n`;
      markdown += `| No. | Nome da Coluna | Descrição |\n`;
      markdown += `|-----|----------------|------------|\n`;

      table.fields.forEach((field) => {
        markdown += `| ${field.number} | ${field.name} | ${field.description} |\n`;
      });

      markdown += `\n---\n\n`;
    });

    return markdown;
  };

  const handleCopy = () => {
    const markdown = generateMarkdown();
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditDescriptions = () => {
    setShowEditModal(true);
  };

  const handleSaveDescriptions = () => {
    // Update tables with new descriptions
    const updatedTables = tables.map((table) => {
      const tableName = table.name.toLowerCase();
      const updatedFields = table.fields.map((field) => {
        const key = `${tableName}_${field.name}`;
        return {
          ...field,
          description: editingDescriptions[key] || field.description,
        };
      });
      return {
        ...table,
        fields: updatedFields,
      };
    });

    setTables(updatedTables);
    setShowEditModal(false);
  };

  const handleDescriptionChange = (
    tableName: string,
    fieldName: string,
    newDescription: string
  ) => {
    const key = `${tableName}_${fieldName}`;
    setEditingDescriptions((prev) => ({
      ...prev,
      [key]: newDescription,
    }));
  };

  const handleDownloadPDF = () => {
    try {
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (!printWindow) {
        alert("Por favor, permita pop-ups para exportar o PDF");
        return;
      }

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Dicionário de Dados</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
    h1 { color: #1e40af; font-size: 24px; margin-bottom: 20px; }
    h2 { color: #3730a3; font-size: 18px; margin-top: 30px; margin-bottom: 10px; }
    h3 { color: #4338ca; font-size: 16px; margin-top: 20px; margin-bottom: 10px; }
    .table-info { background: #eef2ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .table-info p { margin: 5px 0; font-size: 14px; }
    .legend { font-size: 11px; color: #666; font-style: italic; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; }
    th { background: #e0e7ff; padding: 8px; text-align: left; border: 1px solid #c7d2fe; font-weight: bold; }
    td { padding: 6px 8px; border: 1px solid #ddd; }
    tr:nth-child(even) { background: #f9fafb; }
    .page-break { page-break-after: always; }
    @media print { body { padding: 10px; } .page-break { page-break-after: always; } }
  </style>
</head>
<body>
  <h1>Dicionário de Dados</h1>
  ${tables
    .map(
      (table, idx) => `
    <div class="${idx > 0 ? "page-break" : ""}">
      <h2>Tabela ${String(idx + 1).padStart(3, "0")}</h2>
      <div class="table-info">
        <p><strong>Nome da Tabela:</strong> ${table.name}</p>
        <p><strong>Descrição:</strong> ${table.description}</p>
        <p><strong>Número de Colunas:</strong> ${table.columnCount}</p>
        <p><strong>Número de Linhas (atual):</strong> ${table.rowCount}</p>
        <p class="legend">PK = Primary Key | FK = Foreign Key | M = Mandatory</p>
      </div>
      <h3>Colunas</h3>
      <table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Nome da Coluna</th>
            <th>PK</th>
            <th>FK</th>
            <th>M</th>
            <th>Tipo do dado</th>
            <th>Espécie do tipo</th>
            <th>Origem</th>
            <th>Fórmula</th>
          </tr>
        </thead>
        <tbody>
          ${table.fields
            .map(
              (field) => `
            <tr>
              <td>${field.number}</td>
              <td>${field.name}</td>
              <td style="text-align: center;">${field.isPK}</td>
              <td style="text-align: center;">${field.isFK}</td>
              <td style="text-align: center;">${field.isMandatory}</td>
              <td>${field.type}</td>
              <td>${field.typeCategory}</td>
              <td>${field.origin}</td>
              <td>${field.formula}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <h3>Descrição das Colunas</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 60px;">No.</th>
            <th style="width: 200px;">Nome da Coluna</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          ${table.fields
            .map(
              (field) => `
            <tr>
              <td>${field.number}</td>
              <td>${field.name}</td>
              <td>${field.description}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
    )
    .join("")}
</body>
</html>`;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = function () {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 500);
      };
    } catch (error) {
      alert("Erro ao exportar PDF: " + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-3xl">
                  Gerador de Dicionário de Dados
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Cole seu schema do Prisma abaixo e gere automaticamente um
                  dicionário de dados no formato da controladoria.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Schema do Prisma
              </label>
              <Textarea
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                placeholder="Cole seu schema do Prisma aqui...&#10;&#10;Exemplo:&#10;model User {&#10;  id Int @id @default(autoincrement())&#10;  email String @unique&#10;  name String?&#10;  posts Post[]&#10;}"
                className="w-full h-64 font-mono text-sm"
              />
            </div>

            <Button onClick={handleGenerate} className="w-full" size="lg">
              Gerar Dicionário de Dados
            </Button>
          </CardContent>
        </Card>

        {tables.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">
                  Dicionário de Dados Gerado
                </CardTitle>
                <div className="flex gap-3">
                  <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editar Descrições
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Descrições dos Campos</DialogTitle>
                        <DialogDescription>
                          Personalize as descrições de todos os campos das
                          tabelas.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        {tables.map((table, tableIdx) => (
                          <div key={tableIdx} className="space-y-4">
                            <h4 className="text-lg font-semibold text-foreground bg-muted p-3 rounded">
                              Tabela: {table.name}
                            </h4>

                            <div className="space-y-4">
                              {table.fields.map((field, fieldIdx) => {
                                const key = `${table.name.toLowerCase()}_${
                                  field.name
                                }`;
                                return (
                                  <div
                                    key={fieldIdx}
                                    className="border rounded-lg p-4"
                                  >
                                    <div className="flex items-center gap-4 mb-2">
                                      <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                        {field.name}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {field.type}
                                      </span>
                                    </div>
                                    <Textarea
                                      value={
                                        editingDescriptions[key] ||
                                        field.description
                                      }
                                      onChange={(e) =>
                                        handleDescriptionChange(
                                          table.name.toLowerCase(),
                                          field.name,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Digite a descrição do campo..."
                                      className="w-full"
                                      rows={2}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowEditModal(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveDescriptions}>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Descrições
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={handleCopy}
                    variant={copied ? "default" : "secondary"}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>

                  <Button onClick={handleDownloadPDF} variant="destructive">
                    <FileDown className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {tables.map((table, idx) => (
                  <Card key={idx}>
                    <CardHeader className="bg-muted/50">
                      <CardTitle className="text-xl">
                        Tabela {String(idx + 1).padStart(3, "0")}
                      </CardTitle>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">
                              Nome da Tabela:
                            </span>{" "}
                            {table.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">Descrição:</span>{" "}
                            {table.description}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">
                              Número de Colunas:
                            </span>{" "}
                            {table.columnCount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">
                              Número de Linhas (atual):
                            </span>{" "}
                            {table.rowCount}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        PK = Primary Key | FK = Foreign Key | M = Mandatory
                      </p>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-bold text-lg mb-3 text-foreground">
                        Colunas
                      </h4>
                      <div className="overflow-x-auto mb-6">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border px-3 py-2 text-left">
                                No.
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Nome da Coluna
                              </th>
                              <th className="border px-3 py-2 text-center">
                                PK
                              </th>
                              <th className="border px-3 py-2 text-center">
                                FK
                              </th>
                              <th className="border px-3 py-2 text-center">
                                M
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Tipo do dado
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Espécie
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Origem
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Fórmula
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.fields.map((field) => (
                              <tr
                                key={field.number}
                                className="hover:bg-muted/50"
                              >
                                <td className="border px-3 py-2">
                                  {field.number}
                                </td>
                                <td className="border px-3 py-2 font-mono text-xs">
                                  {field.name}
                                </td>
                                <td className="border px-3 py-2 text-center">
                                  {field.isPK}
                                </td>
                                <td className="border px-3 py-2 text-center">
                                  {field.isFK}
                                </td>
                                <td className="border px-3 py-2 text-center">
                                  {field.isMandatory}
                                </td>
                                <td className="border px-3 py-2 font-mono text-xs">
                                  {field.type}
                                </td>
                                <td className="border px-3 py-2 text-xs">
                                  {field.typeCategory}
                                </td>
                                <td className="border px-3 py-2 text-xs">
                                  {field.origin}
                                </td>
                                <td className="border px-3 py-2 font-mono text-xs">
                                  {field.formula}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <h4 className="font-bold text-lg mb-3 text-foreground">
                        Descrição das Colunas
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border px-3 py-2 text-left">
                                No.
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Nome da Coluna
                              </th>
                              <th className="border px-3 py-2 text-left">
                                Descrição
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.fields.map((field) => (
                              <tr
                                key={field.number}
                                className="hover:bg-muted/50"
                              >
                                <td className="border px-3 py-2">
                                  {field.number}
                                </td>
                                <td className="border px-3 py-2 font-mono text-xs">
                                  {field.name}
                                </td>
                                <td className="border px-3 py-2 text-xs">
                                  {field.description}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
