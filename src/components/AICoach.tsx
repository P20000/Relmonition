"use client";

import React from 'react';
import { useAICoach } from './coach/useAICoach';
import { ChatHistorySidebar } from './coach/ChatHistorySidebar';
import { ChatWindow } from './coach/ChatWindow';
import { StrategyChoiceModal } from './coach/ContextUploadModal';

export function AICoach() {
  const {
    mode,
    setMode,
    messages,
    input,
    setInput,
    isSending,
    isStreaming,
    conversations,
    activeSessionId,
    setActiveSessionId,
    isEditing,
    setIsEditing,
    editInput,
    setEditInput,
    chatError,
    setChatError,
    showErrorDetails,
    setShowErrorDetails,
    isHistoryOpen,
    setIsHistoryOpen,
    contextUploads,
    showStrategyModal,
    setShowStrategyModal,
    pendingFile,
    uploadStatus,
    uploadError,
    handleSend,
    handleStop,
    handleRegenerate,
    handleEdit,
    handleDeleteConversation,
    handleDeleteContext,
    startNewConversation,
    handleFileSelection,
    executeUpload,
  } = useAICoach();

  return (
    <div className="min-h-screen bg-transparent flex justify-center">
      <div className="w-full max-w-[1600px] flex relative">
        {/* Strategy Choice Modal */}
        {showStrategyModal && (
          <StrategyChoiceModal 
            pendingFile={pendingFile}
            executeUpload={executeUpload}
            setShowStrategyModal={setShowStrategyModal}
          />
        )}

        {/* Mobile Sidebar Overlay */}
        {isHistoryOpen && (
          <div 
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
            onClick={() => setIsHistoryOpen(false)}
          />
        )}

        {/* Sidebar: Conversations */}
        <ChatHistorySidebar 
          conversations={conversations}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          handleDeleteConversation={handleDeleteConversation}
          startNewConversation={startNewConversation}
        />

        {/* Main Chat Area */}
        <ChatWindow 
          mode={mode}
          setMode={setMode}
          messages={messages}
          input={input}
          setInput={setInput}
          isSending={isSending}
          isStreaming={isStreaming}
          activeSessionId={activeSessionId}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editInput={editInput}
          setEditInput={setEditInput}
          chatError={chatError}
          setChatError={setChatError}
          showErrorDetails={showErrorDetails}
          setShowErrorDetails={setShowErrorDetails}
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          contextUploads={contextUploads}
          uploadStatus={uploadStatus}
          uploadError={uploadError}
          handleSend={handleSend}
          handleStop={handleStop}
          handleRegenerate={handleRegenerate}
          handleEdit={handleEdit}
          handleFileSelection={handleFileSelection}
          handleDeleteContext={handleDeleteContext}
        />
      </div>
    </div>
  );
}
