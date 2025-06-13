import {
	View,
	Text,
	FlatList,
	Pressable,
	StyleSheet,
	Dimensions,
	ViewToken,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import customColors from "@/tailwind.colors";
import tailwindColors from "tailwindcss/colors";
import Training from "./(sunday,monday,tuesday,wednesday,thursday,friday,saturday)/_layout";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
} from "react-native-reanimated";

export enum Days {
	sunday = "D",
	monday = "S",
	tuesday = "T",
	wednesday = "Q",
	thursday = "Q",
	friday = "S",
	saturday = "S",
}

const dayKeys = Object.keys(Days);
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TAB_BAR_HORIZONTAL_MARGIN = 32;
const TAB_BAR_WIDTH = SCREEN_WIDTH - TAB_BAR_HORIZONTAL_MARGIN;
const TAB_WIDTH = TAB_BAR_WIDTH / dayKeys.length;
const INDICATOR_SIZE = 46;

export default function TrainingsLayout() {
	const todayIndex = new Date().getDay();
	const [currentIndex, setCurrentIndex] = useState(todayIndex);
	const flatListRef = useRef<FlatList>(null);
	const isScrollingByPress = useRef(false);

	const translateX = useSharedValue(
		todayIndex * TAB_WIDTH + (TAB_WIDTH - INDICATOR_SIZE) / 2
	);

	useEffect(() => {
		const targetX = currentIndex * TAB_WIDTH + (TAB_WIDTH - INDICATOR_SIZE) / 2;
		translateX.value = withSpring(targetX, {
			damping: 15,
			stiffness: 120,
		});
	}, [currentIndex]);

	const animatedIndicatorStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: translateX.value }],
		};
	});

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			flatListRef.current?.scrollToIndex({
				index: todayIndex,
				animated: false,
			});
		}, 100);
		return () => clearTimeout(timeoutId);
	}, [todayIndex]);

	const handleDayPress = (index: number) => {
		if (currentIndex !== index) {
			isScrollingByPress.current = true;
			setCurrentIndex(index);
			flatListRef.current?.scrollToIndex({ index, animated: true });
		}
	};

	const onViewableItemsChanged = useRef(
		({ viewableItems }: { viewableItems: ViewToken[] }) => {
			if (isScrollingByPress.current) {
				return;
			}
			if (viewableItems.length > 0) {
				const newIndex = viewableItems[0].index;
				if (newIndex !== null && typeof newIndex === "number" && currentIndex !== newIndex) {
					setCurrentIndex(newIndex);
				}
			}
		}
	).current;
    
    const handleMomentumScrollEnd = () => {
        isScrollingByPress.current = false;
    };

	const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

	return (
		<View style={styles.container}>
			<View style={styles.tabBar}>
				<View style={styles.staticIndicatorsContainer}>
					{dayKeys.map((_, index) => (
						<View key={index} style={styles.staticIndicator} />
					))}
				</View>

				<Animated.View
					style={[styles.activeIndicator, animatedIndicatorStyle]}
				/>

				{Object.entries(Days).map(([key, value], index) => (
					<Pressable
						key={key}
						onPress={() => handleDayPress(index)}
						style={styles.tabItem}
					>
						<Text style={styles.labelText}>{value}</Text>
					</Pressable>
				))}
			</View>

			<FlatList
				ref={flatListRef}
				data={dayKeys}
				keyExtractor={(item) => item}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				bounces={false}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={viewabilityConfig}
				initialScrollIndex={todayIndex}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                onScrollToIndexFailed={info => {
                    const wait = new Promise(resolve => setTimeout(resolve, 200));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                    });
                }}
				getItemLayout={(data, index) => ({
					length: SCREEN_WIDTH,
					offset: SCREEN_WIDTH * index,
					index,
				})}
				renderItem={({ item: dayKey }) => (
					<View style={styles.pageContainer}>
						<Training segment={`(${dayKey})`} />
					</View>
				)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: customColors.background,
	},
	tabBar: {
		flexDirection: "row",
		height: 50,
		borderRadius: 24,
		marginHorizontal: 16,
		marginTop: 8,
		backgroundColor: customColors.background,
		position: "relative",
		alignItems: "center",
	},
	staticIndicatorsContainer: {
		position: "absolute",
		width: "100%",
		height: "100%",
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
	},
	staticIndicator: {
		width: INDICATOR_SIZE,
		height: INDICATOR_SIZE,
		borderRadius: INDICATOR_SIZE / 2,
		backgroundColor: customColors.lightBackground,
	},
	activeIndicator: {
		position: "absolute",
		height: INDICATOR_SIZE,
		width: INDICATOR_SIZE,
		borderRadius: INDICATOR_SIZE / 2,
		backgroundColor: customColors.main,
		zIndex: 1, 
	},
	tabItem: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
		zIndex: 2,
	},
	labelText: {
		fontWeight: "bold",
		fontSize: 16,
		color: tailwindColors.white,
	},
	pageContainer: {
		width: SCREEN_WIDTH,
		paddingTop: 16,
        flex: 1,
	},
});