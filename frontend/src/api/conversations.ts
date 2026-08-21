import { api } from './index'

export const listConversations = api.conversations.list
export const createConversation = api.conversations.create
export const renameConversation = api.conversations.rename
export const listMessages = api.conversations.messages
export const sendMessage = api.conversations.send
