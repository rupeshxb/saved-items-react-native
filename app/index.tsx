import { 
  View, FlatList, StyleSheet, ActivityIndicator, Text, 
  TouchableOpacity, Modal, TextInput, Alert, ScrollView, StatusBar, Pressable, Share 
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { ItemRepository } from '../services/ItemRepository';
import { AuthRepository } from '../services/AuthRepository';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // State
  const [myItems, setMyItems] = useState<any[]>([]);
  const [sharedItems, setSharedItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('myVault');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // UI State
  const [detailVisible, setDetailVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [shareInput, setShareInput] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  // REFS
  const unsubMyItems = useRef<(() => void) | undefined>();
  const unsubSharedItems = useRef<(() => void) | undefined>();

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", "Copied to clipboard.");
  };

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (unsubMyItems.current) unsubMyItems.current();
        if (unsubSharedItems.current) unsubSharedItems.current();
        setMyItems([]);
        setSharedItems([]);
        setCurrentUser(null);
        router.replace('/login');
      } else {
        setCurrentUser(user);
        unsubMyItems.current = ItemRepository.getMyItems((data) => {
          setMyItems(data);
          setLoading(false);
        });
        unsubSharedItems.current = ItemRepository.getSharedItems((data) => {
          setSharedItems(data);
          setLoading(false);
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubMyItems.current) unsubMyItems.current();
      if (unsubSharedItems.current) unsubSharedItems.current();
    };
  }, [rootNavigationState?.key]);

  // NEW: Real-time Item Observer (Handles deleted/missing items)
  useEffect(() => {
    let unsub: (() => void) | undefined;

    if (detailVisible && selectedItem?.id) {
      unsub = ItemRepository.subscribeToItem(selectedItem.id, (updatedItem) => {
        if (updatedItem === null) {
          // Document was deleted while we were looking at it
          setDetailVisible(false);
          setSelectedItem(null);
          Alert.alert("Item Unavailable", "This item has been deleted or your access was revoked.");
        } else {
          setSelectedItem(updatedItem);
        }
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [detailVisible, selectedItem?.id]);

  // --- ACTIONS ---

  const handleDelete = () => {
    if (!selectedItem) return;
    Alert.alert("Delete Item", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", style: 'destructive', onPress: async () => {
          try {
            await ItemRepository.deleteItem(selectedItem.id);
            setDetailVisible(false);
            setSelectedItem(null);
          } catch (error: any) { Alert.alert("Error", error.message); }
        }
      }
    ]);
  };

  const handleLogout = async () => {
    if (unsubMyItems.current) unsubMyItems.current();
    if (unsubSharedItems.current) unsubSharedItems.current();
    setMenuVisible(false);
    await signOut(auth);
  }

  const handleOpenItem = (item: any) => {
    setSelectedItem(item);
    setShareInput('');
    setGeneratedLink(Linking.createURL(`/items/${item.id}`));
    setDetailVisible(true);
  }

  const handleCloseItem = () => {
    setDetailVisible(false);
    setSelectedItem(null);
  }

  const handleTogglePublic = async () => {
    if (!selectedItem) return;
    const newStatus = !selectedItem.isPublic;
    try {
      await ItemRepository.setPublicStatus(selectedItem.id, newStatus);
      // Local state will update via the subscribeToItem effect
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleQuickShare = async (item: any) => {
    const link = Linking.createURL(`/items/${item.id}`);
    if (!item.isPublic) {
      Alert.alert("Link is Private", "Enable the public link in settings to share this.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => handleOpenItem(item) }
      ]);
      return;
    }
    try {
      await Share.share({ message: `Check out this secure item: ${item.title}\n\n${link}` });
    } catch (error) { console.log("Error sharing", error); }
  };

  const handleShareUser = async () => {
    if (!shareInput || !selectedItem) return;
    try {
      const userFound = await AuthRepository.findUserByIdentity(shareInput);
      if (!userFound) { Alert.alert("Error", "User not found."); return; }
      if (userFound.email === auth.currentUser?.email) { Alert.alert("Error", "Cannot share with yourself."); return; }
      await ItemRepository.shareItem(selectedItem.id, userFound.uid, userFound.email);
      setShareInput('');
      Alert.alert("Success", `Shared with ${userFound.email}`);
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  const handleUnshareUser = (emailToRemove: string) => {
    Alert.alert("Revoke Access", `Remove ${emailToRemove}?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Revoke", style: 'destructive', onPress: async () => {
          try {
            if (!selectedItem) return;
            await ItemRepository.unshareItem(selectedItem.id, emailToRemove);
            Alert.alert("Success", "User removed.");
          } catch (e: any) { Alert.alert("Error", e.message); }
        }
      }
    ]);
  };

  const getInitial = () => {
    if (currentUser?.displayName) return currentUser.displayName.charAt(0).toUpperCase();
    if (currentUser?.email) return currentUser.email.charAt(0).toUpperCase();
    return "U";
  }

  const isOwner = selectedItem && auth.currentUser && selectedItem.userId === auth.currentUser.uid;
  const displayData = activeTab === 'myVault' ? myItems : sharedItems;

  if (loading && !currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0288D1" />

      {/* HEADER */}
      <View style={styles.skyHeader}>
        <View style={styles.headerContent}>
          <View style={styles.vaultIconContainer}><Text style={{ fontSize: 24 }}>🛡️</Text></View>
          <View>
            <Text style={styles.headerTitle}>SecureVault</Text>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingText}>Hello,</Text>
              <Text style={styles.usernameText} numberOfLines={1}>{currentUser?.displayName || "User"}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.hamburgerBtn}>
          <Ionicons name="menu" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'myVault' && styles.activeTab]} onPress={() => setActiveTab('myVault')}>
          <Text style={[styles.tabText, activeTab === 'myVault' && styles.activeTabText]}>My Vault ({myItems.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'shared' && styles.activeTab]} onPress={() => setActiveTab('shared')}>
          <Text style={[styles.tabText, activeTab === 'shared' && styles.activeTabText]}>Shared to Me ({sharedItems.length})</Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cardContainer} activeOpacity={0.8} onPress={() => handleOpenItem(item)}>
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.description ? <Text numberOfLines={1} style={styles.description}>{item.description}</Text> : null}
                  <View style={styles.badgeContainer}>
                    {item.isPublic && <View style={styles.badgePublic}><Text style={styles.badgeTextPublic}>🌐 Public Link</Text></View>}
                    {activeTab === 'shared' ? (
                      <View style={styles.badgeSharedBy}><Text style={styles.badgeTextSharedBy}>From: {item.ownerName || item.ownerEmail || 'Unknown'}</Text></View>
                    ) : (
                      item.sharedEmails && item.sharedEmails.length > 0 && (
                        <View style={styles.badgeSharedWith}><Text style={styles.badgeTextSharedWith}>👥 Shared with {item.sharedEmails.length}</Text></View>
                      )
                    )}
                  </View>
                </View>
                {activeTab === 'myVault' && (
                  <TouchableOpacity style={styles.quickShareBtn} onPress={(e) => { e.stopPropagation(); handleQuickShare(item); }}>
                    <Ionicons name="share-social" size={20} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>{activeTab === 'myVault' ? "Click '+' to secure your first item." : "No shared secrets."}</Text></View>}
      />

      {/* FAB */}
      {activeTab === 'myVault' && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/add')}>
          <Ionicons name="add" size={32} color="#333" />
        </TouchableOpacity>
      )}

      {/* MENU MODAL */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHeader}>
              <View style={styles.largeAvatar}><Text style={styles.largeAvatarText}>{getInitial()}</Text></View>
              <Text style={styles.menuName}>{currentUser?.displayName}</Text>
              <Text style={styles.menuEmail}>{currentUser?.email}</Text>
            </View>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuLogoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
              <Text style={styles.menuLogoutText}>Log Out</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal visible={detailVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCloseItem}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Item Details</Text>
            <TouchableOpacity onPress={handleCloseItem}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.detailTitle}>{selectedItem?.title}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 }}>
              <Text style={styles.label}>Description / Secret</Text>
              <TouchableOpacity onPress={() => copyToClipboard(selectedItem?.description)}><Text style={{ color: '#0288D1', fontWeight: 'bold' }}>📋 Copy</Text></TouchableOpacity>
            </View>
            <View style={styles.secretBox}>
              <Text style={styles.detailText}>{selectedItem?.description || "No description provided."}</Text>
            </View>
            <Text style={styles.label}>Secure URL</Text>
            <Text style={styles.linkText} onPress={() => selectedItem?.url && Linking.openURL(selectedItem.url)}>{selectedItem?.url || "No link"}</Text>
            <View style={styles.divider} />

            {isOwner ? (
              <View>
                <Text style={styles.sectionTitle}>Link Sharing</Text>
                <View style={styles.publicLinkBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, color: '#555' }}>{selectedItem?.isPublic ? "Link is ACTIVE 🟢" : "Link is OFF 🔴"}</Text>
                    <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: selectedItem?.isPublic ? '#FFEBEE' : '#E8F5E9' }]} onPress={handleTogglePublic}>
                      <Text style={{ color: selectedItem?.isPublic ? '#D32F2F' : '#2E7D32', fontWeight: 'bold' }}>{selectedItem?.isPublic ? "Disable" : "Enable Public Link"}</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedItem?.isPublic && (
                    <View>
                      <Text style={styles.generatedLinkText} numberOfLines={1}>{generatedLink}</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                        <TouchableOpacity style={styles.linkActionBtn} onPress={() => copyToClipboard(generatedLink)}><Text style={styles.linkActionText}>📋 Copy Link</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.linkActionBtn} onPress={() => Share.share({ message: generatedLink })}><Text style={styles.linkActionText}>📤 Share</Text></TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Manage Access</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => { setDetailVisible(false); router.push({ pathname: "/edit", params: { id: selectedItem.id } }); }}><Text style={styles.editBtnText}>✏️ Edit</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}><Text style={styles.deleteBtnText}>🗑️ Delete</Text></TouchableOpacity>
                </View>
                <View style={styles.inputRow}>
                  <TextInput style={styles.input} placeholder="friend@email.com" value={shareInput} onChangeText={setShareInput} autoCapitalize="none" />
                  <TouchableOpacity style={styles.shareBtn} onPress={handleShareUser}><Text style={styles.shareBtnText}>Add User</Text></TouchableOpacity>
                </View>
                <Text style={styles.label}>Shared With (Email)</Text>
                {selectedItem?.sharedEmails?.length > 0 ? (
                  selectedItem.sharedEmails.map((email: string, i: number) => (
                    <View key={i} style={styles.userRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}><Text style={{ fontSize: 16 }}>👤 </Text><Text style={styles.userEmailText}>{email}</Text></View>
                      <TouchableOpacity style={styles.revokeBtn} onPress={() => handleUnshareUser(email)}><Text style={styles.revokeBtnText}>Remove</Text></TouchableOpacity>
                    </View>
                  ))
                ) : (<Text style={styles.emptyListText}>Not shared with specific people.</Text>)}
              </View>
            ) : (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>🔒 Owner Identity</Text>
                <Text style={styles.infoRow}>Name: <Text style={{ fontWeight: 'bold' }}>{selectedItem?.ownerName || 'Unknown'}</Text></Text>
                <Text style={styles.infoRow}>Email: {selectedItem?.ownerEmail || 'Hidden'}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F9FF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  // Header
  skyHeader: { backgroundColor: '#0288D1', paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  vaultIconContainer: { width: 45, height: 45, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { color: '#B3E5FC', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  hamburgerBtn: { padding: 5 },

  // 1. HEADER TEXT STYLES (CONTRAST NO PILL)
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center', // Aligns text vertically
    marginTop: 2,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.7)', // Slightly faded white for "Hello,"
    fontSize: 18,
    marginRight: 6,
    fontWeight: '400',
  },
  usernameText: {
    color: '#E1F5FE',   // <--- THE NEW COLOR (Pale Sky Blue)
    fontSize: 20,       // Slightly larger
    fontWeight: 'bold', // Bolder to stand out
    maxWidth: 200,      // Prevents overlap if name is huge
  },

  // Tabs
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  activeTab: { borderColor: '#0288D1' },
  tabText: { color: '#90A4AE', fontWeight: '600' },
  activeTabText: { color: '#0288D1', fontWeight: 'bold' },

  // Card
  cardContainer: { marginHorizontal: 20, marginTop: 15 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderLeftWidth: 5, borderLeftColor: '#4FC3F7', shadowOpacity: 0.05, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  description: { color: '#666', fontSize: 14, marginBottom: 8 },

  // Badges
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5 },
  badgeSharedBy: { backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTextSharedBy: { color: '#FFA000', fontSize: 11, fontWeight: '600' },

  badgeSharedWith: { backgroundColor: '#E1F5FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTextSharedWith: { color: '#0288D1', fontSize: 11, fontWeight: '600' },

  badgePublic: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTextPublic: { color: '#2E7D32', fontSize: 11, fontWeight: '600' },

  // Share Button
  quickShareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0288D1', // Blue circle
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    marginLeft: 10
  },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#90A4AE', fontSize: 16 },

  // Fab
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFCA28', justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.3, elevation: 6 },
  fabText: { color: '#333', fontSize: 32, marginTop: -2 },

  // Menu Modal
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: 10 },
  menuContainer: { width: 280, backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowOpacity: 0.2, elevation: 10 },
  menuHeader: { alignItems: 'center', marginBottom: 15 },
  largeAvatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  largeAvatarText: { fontSize: 28, color: '#0288D1', fontWeight: 'bold' },
  menuDivider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  menuName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#0277BD',            // Strong Blue Text
    backgroundColor: '#E1F5FE',  // Light Blue Background (Highlight)
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,            // Rounded "Pill" shape
    marginBottom: 6,
    overflow: 'hidden',          // Ensures rounded corners work on all devices
    textAlign: 'center'
  },
  menuEmail: {
    fontSize: 14,
    color: '#546E7A',            // Blue-Grey (Softer than black)
    fontWeight: '500'
  },

  // 2. LOGOUT BUTTON STYLES (NEW)
  menuLogoutBtn: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  menuLogoutText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 16
  },

  // Detail Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#0288D1' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  closeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalContent: { padding: 20, paddingBottom: 50 },
  detailTitle: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  label: { fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 5, marginTop: 15 },
  detailText: { fontSize: 16, color: '#444', lineHeight: 22 },
  linkText: { fontSize: 16, color: '#0288D1', textDecorationLine: 'underline' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },

  // Public Link Box
  publicLinkBox: {
    backgroundColor: '#FAFAFA',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  generatedLinkText: { backgroundColor: '#fff', padding: 8, borderRadius: 5, borderWidth: 1, borderColor: '#ddd', color: '#666', fontSize: 12 },
  linkActionBtn: { backgroundColor: '#E1F5FE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  linkActionText: { fontSize: 12, color: '#0288D1', fontWeight: '600' },

  inputRow: { flexDirection: 'row', marginBottom: 15, marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#FAFAFA', marginRight: 10 },
  shareBtn: { backgroundColor: '#0288D1', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
  shareBtnText: { color: '#fff', fontWeight: 'bold' },

  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  userEmailText: { color: '#333', fontSize: 15, fontWeight: '500' },
  revokeBtn: { backgroundColor: '#FFEBEE', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  revokeBtnText: { color: '#D32F2F', fontSize: 12, fontWeight: 'bold' },
  emptyListText: { fontStyle: 'italic', color: '#aaa', marginTop: 5 },

  infoCard: { backgroundColor: '#E1F5FE', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#B3E5FC' },
  infoTitle: { fontWeight: 'bold', color: '#0277BD', marginBottom: 10, fontSize: 16 },
  infoRow: { fontSize: 14, color: '#01579B', marginBottom: 4 },

  secretBox: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 10 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15, gap: 10 },
  editBtn: { flex: 1, backgroundColor: '#E1F5FE', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#B3E5FC' },
  editBtnText: { color: '#0288D1', fontWeight: 'bold', fontSize: 16 },
  deleteBtn: { flex: 1, backgroundColor: '#FFEBEE', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
  deleteBtnText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },
});