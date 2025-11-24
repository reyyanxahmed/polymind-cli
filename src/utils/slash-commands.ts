/**
 * Slash Command System - Copilot-style command parser
 * Supports: /debate, /persona, /config, /help, /clear, /exit, /model
 */

export interface SlashCommand {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  examples: string[];
  execute: (args: string[], context: ChatContext) => Promise<CommandResult>;
}

export interface ChatContext {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  currentPersona: string;
  settings: Record<string, any>;
  sessionId: string;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  clearScreen?: boolean;
}

export const SLASH_COMMANDS: Record<string, SlashCommand> = {
  debate: {
    name: 'debate',
    aliases: ['d'],
    description: 'Start a multi-persona debate',
    usage: '/debate <question>',
    examples: [
      '/debate Should AI have rights?',
      '/d Future of work',
    ],
    execute: async (args, context) => {
      if (args.length === 0) {
        return {
          success: false,
          message: '❌ Please provide a debate topic. Usage: /debate <question>',
        };
      }
      const question = args.join(' ');
      return {
        success: true,
        data: { type: 'debate', question },
        message: `🎭 Starting debate: "${question}"`,
      };
    },
  },

  persona: {
    name: 'persona',
    aliases: ['p', 'switch'],
    description: 'Switch active persona or list available',
    usage: '/persona [name]',
    examples: [
      '/persona explorer',
      '/p list',
      '/persona',
    ],
    execute: async (args, context) => {
      if (args.length === 0 || args[0] === 'list') {
        return {
          success: true,
          data: { type: 'list-personas' },
          message: '📋 Available personas:',
        };
      }
      const personaName = args[0];
      return {
        success: true,
        data: { type: 'switch-persona', persona: personaName },
        message: `🎭 Switched to ${personaName}`,
      };
    },
  },

  model: {
    name: 'model',
    aliases: ['m'],
    description: 'Switch LLM model',
    usage: '/model <name>',
    examples: [
      '/model gemini-2.0-flash-exp',
      '/m claude-3-opus',
    ],
    execute: async (args, context) => {
      if (args.length === 0) {
        return {
          success: false,
          message: '❌ Please specify model. Usage: /model <name>',
        };
      }
      return {
        success: true,
        data: { type: 'switch-model', model: args[0] },
        message: `🔄 Switched to ${args[0]}`,
      };
    },
  },

  config: {
    name: 'config',
    aliases: ['settings', 'set'],
    description: 'View or update configuration',
    usage: '/config [key] [value]',
    examples: [
      '/config',
      '/config streaming false',
      '/set quirks true',
    ],
    execute: async (args, context) => {
      if (args.length === 0) {
        return {
          success: true,
          data: { type: 'show-config', settings: context.settings },
        };
      }
      if (args.length === 1) {
        return {
          success: true,
          message: `${args[0]}: ${context.settings[args[0]] ?? 'not set'}`,
        };
      }
      const [key, value] = args;
      return {
        success: true,
        data: { type: 'update-config', key, value },
        message: `✓ Updated ${key} = ${value}`,
      };
    },
  },

  help: {
    name: 'help',
    aliases: ['h', '?'],
    description: 'Show available commands',
    usage: '/help [command]',
    examples: [
      '/help',
      '/help debate',
      '/?',
    ],
    execute: async (args, context) => {
      if (args.length === 0) {
        return {
          success: true,
          data: { type: 'show-help', commands: Object.values(SLASH_COMMANDS) },
        };
      }
      const cmd = SLASH_COMMANDS[args[0]];
      if (!cmd) {
        return {
          success: false,
          message: `❌ Unknown command: ${args[0]}`,
        };
      }
      return {
        success: true,
        data: { type: 'show-command-help', command: cmd },
      };
    },
  },

  clear: {
    name: 'clear',
    aliases: ['cls', 'c'],
    description: 'Clear chat history',
    usage: '/clear',
    examples: ['/clear', '/cls'],
    execute: async (args, context) => {
      return {
        success: true,
        data: { type: 'clear-history' },
        message: '🗑️  Chat history cleared',
        clearScreen: true,
      };
    },
  },

  history: {
    name: 'history',
    aliases: ['hist'],
    description: 'Show conversation history',
    usage: '/history [count]',
    examples: ['/history', '/history 10'],
    execute: async (args, context) => {
      const count = args[0] ? parseInt(args[0]) : 20;
      return {
        success: true,
        data: { type: 'show-history', count },
      };
    },
  },

  export: {
    name: 'export',
    aliases: ['save'],
    description: 'Export conversation to file',
    usage: '/export [filename]',
    examples: ['/export', '/export chat-2024-11-24.txt'],
    execute: async (args, context) => {
      const filename = args[0] || `polymind-chat-${Date.now()}.txt`;
      return {
        success: true,
        data: { type: 'export-chat', filename },
        message: `💾 Exported to ${filename}`,
      };
    },
  },

  exit: {
    name: 'exit',
    aliases: ['quit', 'q'],
    description: 'Exit interactive mode',
    usage: '/exit',
    examples: ['/exit', '/q'],
    execute: async (args, context) => {
      return {
        success: true,
        data: { type: 'exit' },
        message: '👋 Goodbye!',
      };
    },
  },
};

/**
 * Parse slash command from input
 */
export function parseSlashCommand(input: string): {
  isCommand: boolean;
  command?: string;
  args?: string[];
} {
  if (!input.startsWith('/')) {
    return { isCommand: false };
  }

  const parts = input.slice(1).trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  return { isCommand: true, command, args };
}

/**
 * Execute slash command with context
 */
export async function executeSlashCommand(
  input: string,
  context: ChatContext
): Promise<CommandResult> {
  const parsed = parseSlashCommand(input);

  if (!parsed.isCommand) {
    return {
      success: false,
      message: 'Not a valid command',
    };
  }

  // Find command by name or alias
  const cmd = Object.values(SLASH_COMMANDS).find(
    (c) => c.name === parsed.command || c.aliases.includes(parsed.command!)
  );

  if (!cmd) {
    return {
      success: false,
      message: `❌ Unknown command: /${parsed.command}. Type /help for available commands.`,
    };
  }

  return await cmd.execute(parsed.args || [], context);
}

/**
 * Get command suggestions for autocomplete
 */
export function getCommandSuggestions(partial: string): string[] {
  if (!partial.startsWith('/')) {
    return [];
  }

  const query = partial.slice(1).toLowerCase();
  const suggestions: string[] = [];

  Object.values(SLASH_COMMANDS).forEach((cmd) => {
    if (cmd.name.startsWith(query)) {
      suggestions.push(`/${cmd.name}`);
    }
    cmd.aliases.forEach((alias) => {
      if (alias.startsWith(query)) {
        suggestions.push(`/${alias}`);
      }
    });
  });

  return suggestions.slice(0, 5); // Limit to 5 suggestions
}
