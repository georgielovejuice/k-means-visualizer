import numpy as np

# photos: array of shape (N, 2) containing the (x, y) coordinates of the photos.
# k: number of groups to form.
photos = load_photos()
k = 3

best, random = np.inf, np.random.default_rng(17)
for attempt in range(15):
    centers = random.choice(photos, k, replace=False)  # drop 3 flags on random photos
    while True:
        old_centers = centers.copy()
        distances = ((photos[:, None] - centers) ** 2).sum(2)  # measure how far each photo is from each flag
        groups = distances.argmin(1)  # each photo joins its closest flag
        for c in np.unique(groups):
            centers[c] = photos[groups == c].mean(0)  # move each flag to the middle of its team
        if (centers == old_centers).all():
            break  # nothing moved, so stop
    spread = distances.min(1).sum()  # score this game
    if spread < best:
        best, best_groups = spread, groups  # keep it if it's the best game so far
print(np.bincount(best_groups))
