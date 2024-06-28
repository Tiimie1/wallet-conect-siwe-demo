import type {
  SIWECreateMessageArgs,
  SIWESession,
  SIWEVerifyMessageArgs,
} from "@web3modal/siwe";
import {
  formatMessage,
  getAddressFromMessage,
  getChainIdFromMessage,
  createSIWEConfig,
} from "@web3modal/siwe";

async function getMessageParams() {
  return {
    domain: window.location.host,
    uri: window.location.origin,
    chains: [11155111],
    statement: "Please sign with your account",
  };
}

async function getSession(): Promise<SIWESession | null> {
  try {
    const response = await fetch("http://localhost:8000/api/session", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to get SIWESession");
    }
    const data = await response.json();
    console.log("got address and chainId", data);
    return data;
  } catch (error) {
    return null;
  }
}

async function verifyMessage({ message, signature }: SIWEVerifyMessageArgs) {
  try {
    console.log("verifying signature");

    const chainId = getChainIdFromMessage(message);
    const address = getAddressFromMessage(message);

    const response = await fetch("http://localhost:8000/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        signature: signature,
        chainId: chainId,
        address: address,
      }),
    });

    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    const { success } = data;
    console.log("verifying was:", success);
    return success;
  } catch (error) {
    console.error("Error verifying signature:", error);
    throw new Error("Failed to get verify session!");
  }
}

async function getNonce() {
  try {
    const response = await fetch("http://localhost:8000/api/nonce", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get JWT token!");
    }

    const data = await response.json();
    const { nonce } = data;
    return nonce;
  } catch (error) {
    console.error("Error getting nonce:", error);
    throw new Error("Failed to get nonce!");
  }
}

async function signOut() {
  try {
    console.log("signed out");
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    throw new Error("Failed to sign out!");
  }
}

async function onSignOut() {
  try {
    const response = await fetch("http://localhost:8000/api/session", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to destroy session!");
    }
  } catch (error) {
    console.error("Error clearing session:", error);
    throw new Error("Failed to destroy session!");
  }
}

export const siweConfig = createSIWEConfig({
  getMessageParams,
  createMessage: ({ address, ...args }: SIWECreateMessageArgs) =>
    formatMessage(args, address),
  getNonce,
  verifyMessage,
  getSession,
  signOut,
  onSignOut,
  onSignIn: () => {
    console.log("i signed in");
  },
});
