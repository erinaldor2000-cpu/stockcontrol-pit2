CREATE TABLE `sessoes_aplicacao` (
	`token_hash` varchar(64) NOT NULL,
	`usuario_id` int NOT NULL,
	`expira_em` timestamp NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessoes_aplicacao_token_hash` PRIMARY KEY(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `ocorrencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`produto_id` int NOT NULL,
	`data_ocorrencia` date NOT NULL,
	`quantidade_sistema` int NOT NULL,
	`quantidade_fisica` int NOT NULL,
	`descricao` text NOT NULL,
	`status` enum('Pendente','Em análise','Resolvido') NOT NULL DEFAULT 'Pendente',
	`referencia` varchar(40),
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ocorrencias_id` PRIMARY KEY(`id`),
	CONSTRAINT `ocorrencias_referencia_unique` UNIQUE(`referencia`)
);
--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`nome` varchar(180) NOT NULL,
	`categoria` varchar(100) NOT NULL,
	`quantidade` int NOT NULL DEFAULT 0,
	`data_cadastro` date NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `produtos_id` PRIMARY KEY(`id`),
	CONSTRAINT `produtos_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(120) NOT NULL,
	`login` varchar(80) NOT NULL,
	`senha` varchar(255) NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `usuarios_login_unique` UNIQUE(`login`)
);
--> statement-breakpoint
ALTER TABLE `sessoes_aplicacao` ADD CONSTRAINT `sessoes_aplicacao_usuario_id_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ocorrencias` ADD CONSTRAINT `ocorrencias_produto_id_produtos_id_fk` FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON DELETE restrict ON UPDATE no action;